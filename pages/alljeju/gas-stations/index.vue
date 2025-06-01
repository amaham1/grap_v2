<template>
  <div class="bg-gray-50">


    <!-- 검색 설정 패널 -->
    <div class="search-panel">
      <GasStationSearchControls
        :user-location="userLocation"
        :is-getting-location="isGettingLocation"
        v-model:search-radius="searchRadius"
        v-model:selected-fuel="selectedFuel"
        :is-searching="isSearching"
        :search-stats="searchStats"
        @get-current-location="handleGetCurrentLocation"
        @search="handleNearbySearch" />
    </div>

    <!-- 주유소 리스트 -->
    <div class="station-list-panel">
      <GasStationStationList
        :top-lowest-price-stations="topLowestPriceStations"
        :favorite-top3-stations="favoriteTop3Stations"
        :selected-fuel="selectedFuel"
        @station-click="handleStationClick" />
    </div>

    <!-- 카카오맵 컨테이너 -->
    <GasStationMapContainer
      :is-map-loaded="isMapLoaded"
      :map-error="mapError"
      :is-searching="isSearching"
      @current-view-search="handleCurrentViewSearch" />

    <!-- 🔧 [DEBUG] 디버그 패널 -->
    <div v-if="showDebugPanel" class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-2xl border border-gray-300 w-96 max-h-96 overflow-hidden">
      <div class="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <h3 class="text-sm font-semibold text-gray-700">🔧 디버그 정보</h3>
        <button
          @click="toggleDebugPanel"
          class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="p-3 overflow-y-auto max-h-80 text-xs">
        <!-- 환경 정보 -->
        <div class="mb-3">
          <h4 class="font-semibold text-gray-700 mb-1">🌐 환경</h4>
          <p class="text-gray-600">{{ debugInfo.environment || '정보 없음' }}</p>
        </div>

        <!-- 마지막 검색 정보 -->
        <div class="mb-3">
          <h4 class="font-semibold text-gray-700 mb-1">🔍 마지막 검색</h4>
          <p class="text-gray-600">{{ debugInfo.lastSearchTime || '검색 없음' }}</p>
          <div v-if="debugInfo.lastSearchResults.stationsFound !== undefined" class="mt-1">
            <span class="text-green-600 font-medium">{{ debugInfo.lastSearchResults.stationsFound }}개 발견</span>
            <span class="text-gray-500 ml-2">반경 {{ debugInfo.lastSearchResults.searchRadius }}km</span>
          </div>
        </div>

        <!-- API 호출 횟수 -->
        <div class="mb-3">
          <h4 class="font-semibold text-gray-700 mb-1">📊 통계</h4>
          <p class="text-gray-600">API 호출: {{ debugInfo.apiCallCount }}회</p>
        </div>

        <!-- 에러 로그 -->
        <div v-if="debugInfo.errors.length > 0" class="mb-3">
          <h4 class="font-semibold text-red-700 mb-1">❌ 에러 로그</h4>
          <div class="space-y-1 max-h-20 overflow-y-auto">
            <p v-for="error in debugInfo.errors" :key="error" class="text-red-600 text-xs">{{ error }}</p>
          </div>
        </div>

        <!-- 빠른 액션 버튼들 -->
        <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
          <button @click="handleDebugAction('compareEnvironment')" class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">환경 비교</button>
          <button @click="handleDebugAction('logCurrentState')" class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">상태 확인</button>
          <button @click="handleDebugAction('forceSearch')" class="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600">강제 검색</button>
          <button @click="handleDebugAction('testAPI')" class="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600">API 테스트</button>
        </div>
      </div>
    </div>

    <!-- 🔧 [DEBUG] 디버그 패널 토글 버튼 (화면 우하단) - 'ddebb' 입력시에만 표시 -->
    <div v-if="showDebugButton" class="fixed bottom-16 right-4 z-[9999]" style="z-index: 9999 !important;">
      <button
        @click="toggleDebugPanel"
        class="w-14 h-14 bg-red-500 text-white rounded-full shadow-2xl hover:bg-red-600 transition-all duration-200 flex items-center justify-center border-2 border-white transform hover:scale-110"
        style="background-color: #ef4444 !important; position: relative !important;">
        <span class="text-xl font-bold">🔧</span>
      </button>
      <!-- 추가 표시용 텍스트 -->
      <div class="absolute -top-8 -left-4 bg-black text-white text-xs px-2 py-1 rounded opacity-75">
        DEBUG
      </div>
    </div>

    <!-- 하단 광고 블록 -->
    <div class="gas-station-ad-container">
      <div class="gas-station-ad-wrapper">
        <GoogleAdsense
          format="rectangle"
          width="320"
          height="50"
          full-width-responsive="false"
          container-class="gas-station-ad-content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GasStation } from '~/types/gasStation';
import { updateTopLowestPriceStations, fuelTypes, formatPrice, getStationPrice } from '~/utils/gasStationUtils';
import { updateDebugInfo, logEnvironmentInfo, setupDebugFunctions } from '~/utils/debugUtils';
// 성능 최적화를 위한 lazy loading
const GasStationMapContainer = defineAsyncComponent(() => import('~/components/GasStation/MapContainer.vue'));
const GasStationSearchControls = defineAsyncComponent(() => import('~/components/GasStation/SearchControls.vue'));
const GasStationStationList = defineAsyncComponent(() => import('~/components/GasStation/StationList.vue'));
const GoogleAdsense = defineAsyncComponent(() => import('~/components/public/GoogleAdsense.vue'));

definePageMeta({
  layout: 'public'
});

const config = useRuntimeConfig();

// 페이지 제목 설정
useHead({
  title: '최저가 주유소 - 제주 지역정보',
  meta: [
    { name: 'description', content: '제주도 최저가 주유소 정보를 카카오맵으로 확인하세요.' }
  ],
  script: [
    {
      src: `//dapi.kakao.com/v2/maps/sdk.js?appkey=${config.public.kakaoMapApiKey}&autoload=false`,
      defer: true
    }
  ]
});

// Pinia 스토어 사용
const gasStationStore = useGasStationStore();
const { handleApiError, withErrorHandling, setupGlobalErrorHandlers } = useErrorHandler();
const { measureFunction, measureRender, startMonitoring, stopMonitoring } = usePerformance();

// 컴포저블 사용
const { getCurrentLocation } = useUserLocation();
const { searchNearbyStations, searchCurrentViewStations } = useGasStationSearch();
const { map, initializeMap, waitForKakaoMaps, moveMapCenter } = useKakaoMap();
const { currentMarkers, clearMarkers, addUserLocationMarker, addGasStationMarkers, moveToStation, closeCurrentInfoWindow } = useGasStationMarkers(map);
const { handleToggleFavorite } = useFavoriteStations();

// 스토어에서 상태 가져오기
const {
  userLocation,
  isGettingLocation,
  searchRadius,
  selectedFuel,
  isSearching,
  searchStats,
  allStations,
  topLowestPriceStations,
  favoriteTop3Stations,
  isMapLoaded,
  mapError,
} = storeToRefs(gasStationStore);

// 로컬 상태 관리 (스토어에 없는 것들만)
const isInitialLoad = ref(true); // 최초 로드 여부

// 🔧 [DEBUG] 디버깅 정보 상태
const debugInfo = ref({
  environment: '',
  lastSearchTime: '',
  lastSearchParams: {},
  lastSearchResults: {},
  apiCallCount: 0,
  errors: [] as string[]
});

const showDebugPanel = ref(false); // 디버그 패널 표시 여부
const showDebugButton = ref(false); // 디버그 버튼 표시 여부
const keySequence = ref(''); // 키보드 입력 시퀀스

// 디버그 패널 토글
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value;
  updateDebugInfo('environment', { host: window.location.hostname });
};

// 키보드 이벤트 핸들러 - 'ddebb' 입력시 디버그 버튼 표시
const handleKeyPress = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  keySequence.value += key;

  // 최근 5글자만 유지
  if (keySequence.value.length > 5) {
    keySequence.value = keySequence.value.slice(-5);
  }

  // 'ddebb' 시퀀스 확인
  if (keySequence.value.includes('ddebb')) {
    showDebugButton.value = true;
    console.log('🔧 [DEBUG] 디버그 모드 활성화됨');
    keySequence.value = ''; // 시퀀스 초기화
  }
};

// 디버그 액션 핸들러
const handleDebugAction = (action: string) => {
  try {
    if (typeof window !== 'undefined' && window.debugGasStations) {
      switch (action) {
        case 'compareEnvironment':
          window.debugGasStations.compareEnvironment();
          break;
        case 'logCurrentState':
          window.debugGasStations.logCurrentState();
          break;
        case 'forceSearch':
          window.debugGasStations.forceSearch();
          break;
        case 'testAPI':
          window.debugGasStations.testAPI();
          break;
        default:
          console.warn('알 수 없는 디버그 액션:', action);
      }
    } else {
      console.warn('디버그 함수가 아직 초기화되지 않았습니다.');
      updateDebugInfo('error', '디버그 함수가 아직 초기화되지 않았습니다.');
    }
  } catch (error) {
    console.error('디버그 액션 실행 중 오류:', error);
    updateDebugInfo('error', `디버그 액션 실행 중 오류: ${error}`);
  }
};

// 이벤트 핸들러
const handleGetCurrentLocation = async () => {
  await withErrorHandling(async () => {
    gasStationStore.setGettingLocation(true);

    try {
      const location = await getCurrentLocation(false);
      gasStationStore.setUserLocation(location);

      if (location && map.value) {
        moveMapCenter(location.latitude, location.longitude, 5);
        addUserLocationMarker(location);
      }
    } finally {
      gasStationStore.setGettingLocation(false);
    }
  }, { action: 'getCurrentLocation' });
};

const handleNearbySearch = async () => {
  if (!userLocation.value) {
    gasStationStore.setError('먼저 현재 위치를 확인해주세요.');
    return;
  }

  await withErrorHandling(async () => {
    gasStationStore.setSearching(true);

    try {
      // 🔍 [PAGE-DEBUG] 주변 검색 시작
      const searchParams = {
        userLocation: userLocation.value,
        searchRadius: searchRadius.value,
        selectedFuel: selectedFuel.value,
        timestamp: new Date().toISOString()
      };

      console.log(`🔍 [PAGE-NEARBY-DEBUG] 주변 검색 시작:`, searchParams);
      updateDebugInfo('search-start', searchParams);

      clearMarkers();

      const stations = await measureFunction(
        'nearby-search',
        () => searchNearbyStations(
          userLocation.value!.latitude,
          userLocation.value!.longitude,
          searchRadius.value,
          selectedFuel.value
        ),
        {
          searchRadius: searchRadius.value,
          selectedFuel: selectedFuel.value,
          userLocation: userLocation.value
        }
      );

      // 🎯 [PAGE-RESULT-DEBUG] 검색 결과 분석
      const searchResults = {
        stationsFound: stations.length,
        searchRadius: searchRadius.value,
        selectedFuel: selectedFuel.value,
        hasUserLocation: !!userLocation.value,
        userLocation: userLocation.value
      };

      console.log(`🎯 [PAGE-NEARBY-RESULT-DEBUG] 주변 검색 결과:`, searchResults);
      updateDebugInfo('search-result', searchResults);

      addGasStationMarkers(stations, selectedFuel.value);

      if (userLocation.value) {
        addUserLocationMarker(userLocation.value);
      }

      if (stations.length === 0) {
        console.warn(`⚠️ [PAGE-WARNING] 검색 반경 ${searchRadius.value}km 내에 주유소가 없습니다.`);
      }

      // 스토어에 데이터 저장
      gasStationStore.setStations(stations);
    } finally {
      gasStationStore.setSearching(false);
    }
  }, { action: 'nearbySearch', endpoint: '/api/public/gas-stations' });
};

const handleCurrentViewSearch = async () => {
  if (!map.value) {
    gasStationStore.setError('지도가 로드되지 않았습니다.');
    return;
  }

  await withErrorHandling(async () => {
    gasStationStore.setSearching(true);

    try {
      const center = map.value.getCenter();
      clearMarkers();

      const stations = await searchCurrentViewStations(
        center.getLat(),
        center.getLng(),
        searchRadius.value,
        selectedFuel.value
      );

      addGasStationMarkers(stations, selectedFuel.value);

      if (userLocation.value) {
        addUserLocationMarker(userLocation.value);
      }

      // 스토어에 데이터 저장
      gasStationStore.setStations(stations);
    } finally {
      gasStationStore.setSearching(false);
    }
  }, { action: 'currentViewSearch', endpoint: '/api/public/gas-stations' });
};

const handleStationClick = (station: GasStation) => {
  moveToStation(station);
};

// 좋아요 토글 핸들러 (컴포저블 래퍼)
const handleToggleFavoriteWrapper = (station: GasStation) => {
  const result = handleToggleFavorite(station, selectedFuel.value);

  if (result.success) {
    // 스토어의 TOP 목록들 업데이트
    gasStationStore.updateTopLists();
    // 마커 즉시 새로고침
    refreshMarkers();
  }
};

// 마커 즉시 새로고침
const refreshMarkers = () => {
  if (allStations.value.length > 0) {
    clearMarkers();
    addGasStationMarkers(allStations.value, selectedFuel.value);

    if (userLocation.value) {
      addUserLocationMarker(userLocation.value);
    }
  }
};

// 연료 타입 변경 시 TOP 목록들 업데이트 및 마커 새로고침
watch(selectedFuel, () => {
  gasStationStore.updateTopLists();
  refreshMarkers();
});

// 컴포넌트 마운트 시 TOP 목록들 초기화
onMounted(() => {
  gasStationStore.updateTopLists();
});

// 환경 정보 디버깅 함수 (유틸리티에서 가져옴)
// logEnvironmentInfo는 이제 utils/debugUtils.ts에서 import됨

// 초기화 및 자동 검색
const initializeApp = async () => {
  await withErrorHandling(async () => {
    // 🌐 [DEBUG] 환경 정보 로깅
    logEnvironmentInfo();

    // 전역 에러 핸들러 설정
    setupGlobalErrorHandlers();

    try {
      await waitForKakaoMaps();
      await initializeMap();
      gasStationStore.setMapLoaded(true);
    } catch (error) {
      gasStationStore.setMapError(true);
      throw error;
    }

    // 전역 함수 설정 (인포윈도우 닫기용)
    window.closeInfoWindow = () => {
      closeCurrentInfoWindow();
    };

    // 전역 함수 설정 (인포윈도우 좋아요 토글용)
    window.toggleStationFavorite = (opinet_id: string) => {
      const station = allStations.value.find(s => s.opinet_id === opinet_id);
      if (station) {
        handleToggleFavoriteWrapper(station);
      }
    };

    // 🔧 [DEBUG] 전역 디버깅 함수 설정
    setupDebugFunctions(allStations);

    // 최초 로드시 자동으로 현재 위치 가져오기
    if (isInitialLoad.value) {
      isInitialLoad.value = false;
      try {
        gasStationStore.setGettingLocation(true);
        const location = await getCurrentLocation(true);
        gasStationStore.setUserLocation(location);

        if (location && map.value) {
          moveMapCenter(location.latitude, location.longitude, 5);
          addUserLocationMarker(location);

          // 자동으로 주변 주유소 검색
          await handleNearbySearch();
        } else {
          // 위치 정보가 없어도 TOP 목록들은 초기화
          gasStationStore.updateTopLists();
        }
      } catch (error) {
        console.error('❌ [INIT-ERROR] 자동 위치 확인 실패:', error);
      } finally {
        gasStationStore.setGettingLocation(false);
      }
    }
  }, { action: 'initializeApp' });
};

// 연료 타입 변경 감지하여 재검색
watch(selectedFuel, () => {
  if (searchStats.value && searchStats.value.total_in_radius > 0) {
    // 현재 검색 결과가 있으면 다시 검색
    handleNearbySearch();
  }
});

onMounted(() => {
  // 성능 측정 시작
  measureRender('gas-stations-page');
  startMonitoring();

  initializeApp();

  // 키보드 이벤트 리스너 추가
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  // 성능 모니터링 중지
  stopMonitoring();

  if (window.closeInfoWindow) {
    delete window.closeInfoWindow;
  }

  // 키보드 이벤트 리스너 제거
  document.removeEventListener('keydown', handleKeyPress);
});

// 전역 타입 선언
declare global {
  interface Window {
    kakao: any;
    closeInfoWindow?: () => void;
    debugGasStations?: {
      logEnv: () => void;
      logCurrentState: () => void;
      forceSearch: () => void;
      compareEnvironment: () => void;
      toggleDebug: () => void;
      getDebugInfo: () => any;
      testAPI: (lat?: number, lng?: number, radius?: number) => Promise<any>;
    };
  }
}
</script>

<style scoped>
/* 검색 패널 스타일 */
.search-panel {
  position: absolute;
  top: 5rem; /* top-20 */
  left: 0.5rem; /* left-2 */
  z-index: 40;
  width: 100%;
  max-width: 20rem; /* max-w-xs */
}

/* 주유소 리스트 패널 스타일 */
.station-list-panel {
  position: absolute;
  top: 5rem; /* top-20 */
  right: 0.5rem; /* right-2 */
  z-index: 40;
  width: 100%;
  max-width: 20rem; /* max-w-xs */
}

/* 태블릿 이상에서의 스타일 */
@media (min-width: 768px) {
  .search-panel {
    max-width: 24rem; /* md:max-w-md */
  }

  .station-list-panel {
    width: 20rem; /* md:w-80 */
    max-width: none;
  }
}

/* 작은 모바일에서 겹침 방지 */
@media (max-width: 640px) {
  .search-panel {
    max-width: calc(50% - 1rem);
  }

  .station-list-panel {
    max-width: calc(50% - 1rem);
  }
}

/* 매우 작은 화면에서는 세로 배치 */
@media (max-width: 480px) {
  .search-panel {
    max-width: calc(100% - 1rem);
    right: 0.5rem;
  }

  .station-list-panel {
    top: 9rem; /* 검색 패널 아래로 이동 */
    left: 0.5rem;
    right: 0.5rem;
    max-width: calc(100% - 1rem);
  }
}

/* 하단 광고 스타일 - 강제 크기 제한 */
.gas-station-ad-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  background: white;
  border-top: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 0 8px;
  overflow: hidden !important;
}

.gas-station-ad-wrapper {
  width: 100%;
  max-width: 320px;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden !important;
}

.gas-station-ad-content {
  width: 100% !important;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
}

/* AdSense 광고 요소 강제 크기 제한 */
.gas-station-ad-content .adsbygoogle {
  width: 100% !important;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  overflow: hidden !important;
  display: block !important;
}

/* AdSense가 동적으로 추가하는 iframe 크기 제한 */
.gas-station-ad-content iframe {
  width: 100% !important;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  overflow: hidden !important;
}

/* 모바일에서 추가 보장 */
@media (max-width: 768px) {
  .gas-station-ad-container {
    height: 50px !important;
    max-height: 50px !important;
  }

  .gas-station-ad-wrapper {
    height: 50px !important;
    max-height: 50px !important;
  }

  .gas-station-ad-content {
    height: 50px !important;
    max-height: 50px !important;
  }

  .gas-station-ad-content .adsbygoogle,
  .gas-station-ad-content iframe {
    height: 50px !important;
    max-height: 50px !important;
  }
}
</style>

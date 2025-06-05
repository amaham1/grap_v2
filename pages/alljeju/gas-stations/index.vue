<template>
  <div class="bg-gray-50">
    <!-- 클라이언트에서만 렌더링되는 지도 관련 컴포넌트들 -->
    <ClientOnly>
      <!-- 검색 설정 패널 -->
      <div class="search-panel">
        <GasStationSearchControls
          :user-location="userLocation"
          :is-getting-location="isGettingLocation"
          v-model:search-radius="searchRadius"
          v-model:selected-fuel="selectedFuel"
          :is-searching="isSearching"
          :search-stats="searchStats"
          :price-update-info="priceUpdateInfo"
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
        @current-view-search="handleCurrentViewSearch"
        @retry="handleMapRetry" />

      <!-- 현재 위치 버튼 -->
      <GasStationLocationButton
        :is-getting-location="isGettingLocation"
        @get-current-location="handleGetCurrentLocation" />

      <!-- 모바일 하단 탭 (768px 이하에서만 표시) -->
      <div class="mobile-bottom-tabs md:hidden">
        <!-- 탭 토글 버튼 -->
        <div
          @click="toggleMobileBottomTabs"
          class="mobile-tab-toggle"
          :class="{ 'active': isMobileTabsOpen }">
          <svg
            class="w-6 h-6 transform transition-transform duration-300"
            :class="{ 'rotate-180': isMobileTabsOpen }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </div>

        <!-- 슬라이드업 탭 컨테이너 -->
        <div
          class="mobile-tabs-container"
          :class="{ 'open': isMobileTabsOpen }">

          <!-- 탭 헤더 -->
          <div class="mobile-tabs-header">
            <button
              @click="activeMobileTab = 'lowest'"
              class="mobile-tab-button"
              :class="{ 'active': activeMobileTab === 'lowest' }">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              최저가 TOP
            </button>
            <button
              @click="activeMobileTab = 'favorites'"
              class="mobile-tab-button"
              :class="{ 'active': activeMobileTab === 'favorites' }">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"></path>
              </svg>
              좋아요 목록
            </button>
          </div>

          <!-- 탭 컨텐츠 -->
          <div class="mobile-tabs-content">
            <!-- 최저가 TOP 탭 -->
            <div v-show="activeMobileTab === 'lowest'" class="mobile-tab-panel">
              <div v-if="topLowestPriceStations.length > 0" class="space-y-2">
                <div
                  v-for="(station, index) in topLowestPriceStations"
                  :key="`mobile-lowest-${station.opinet_id}`"
                  @click="handleStationClick(station)"
                  class="mobile-station-item">
                  <div class="flex items-center space-x-3 max-w-[200px]">
                    <div class="mobile-station-rank">
                      {{ index + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="mobile-station-name">{{ station.name }}</div>
                      <div class="mobile-station-address">{{ station.address }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="mobile-station-price">
                      {{ formatPrice(getStationPrice(station, selectedFuel)) }}원/L
                    </div>
                    <div v-if="station.distance" class="mobile-station-distance">
                      {{ station.distance.toFixed(1) }}km
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mobile-empty-state">
                <div class="text-gray-400 text-2xl mb-2">🔍</div>
                <p class="text-gray-600 text-sm">주변 주유소를 검색해보세요.</p>
              </div>
            </div>

            <!-- 좋아요 목록 탭 -->
            <div v-show="activeMobileTab === 'favorites'" class="mobile-tab-panel">
              <div v-if="favoriteTop3Stations.length > 0" class="space-y-2">
                <div
                  v-for="(station, index) in favoriteTop3Stations"
                  :key="`mobile-favorite-${station.opinet_id}`"
                  @click="handleStationClick(station)"
                  class="mobile-station-item favorite">
                  <div class="flex items-center space-x-3 max-w-[200px]">
                    <div class="mobile-station-rank favorite">
                      {{ index + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="mobile-station-name">{{ station.name }}</div>
                      <div class="mobile-station-address">{{ station.address }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="mobile-station-price favorite">
                      {{ formatPrice(getStationPrice(station, selectedFuel)) }}원/L
                    </div>
                    <div v-if="station.distance" class="mobile-station-distance">
                      {{ station.distance.toFixed(1) }}km
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mobile-empty-state">
                <div class="text-pink-400 text-2xl mb-2">💖</div>
                <p class="text-gray-600 text-sm">좋아요한 주유소가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 로딩 상태 표시 (서버 사이드에서) -->
      <template #fallback>
        <div class="w-full h-[calc(100vh-109px)] flex items-center justify-center bg-gray-100">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">지도를 불러오는 중...</p>
          </div>
        </div>
      </template>
    </ClientOnly>

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
          <div v-if="debugInfo.lastSearchResults && (debugInfo.lastSearchResults as any).stationsFound !== undefined" class="mt-1">
            <span class="text-green-600 font-medium">{{ (debugInfo.lastSearchResults as any).stationsFound }}개 발견</span>
            <span class="text-gray-500 ml-2">반경 {{ (debugInfo.lastSearchResults as any).searchRadius }}km</span>
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
const GasStationLocationButton = defineAsyncComponent(() => import('~/components/GasStation/LocationButton.vue'));


definePageMeta({
  layout: 'public'
});

const config = useRuntimeConfig();

// 카카오맵 API 키 확인 및 폴백 처리
const kakaoMapApiKey = config.public.kakaoMapApiKey;
const isValidApiKey = kakaoMapApiKey && kakaoMapApiKey !== 'f7c0b5b7e8a4c5d6e7f8a9b0c1d2e3f4';

// 카카오맵 API 키 검증

// 페이지 제목 설정
useHead({
  title: '최저가 주유소 - Grap',
  meta: [
    { name: 'description', content: '제주도 최저가 주유소 정보를 카카오맵으로 확인하세요.' }
  ],
  script: isValidApiKey ? [
    {
      src: `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false`,
      defer: true
    }
  ] : []
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
const { updateInfo: priceUpdateInfo, fetchUpdateInfo } = useGasPriceUpdateInfo();

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

// 모바일 하단 탭 상태
const isMobileTabsOpen = ref(false); // 모바일 탭 열림 상태
const activeMobileTab = ref<'lowest' | 'favorites'>('lowest'); // 활성 탭

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

// 모바일 하단 탭 토글
const toggleMobileBottomTabs = () => {
  isMobileTabsOpen.value = !isMobileTabsOpen.value;
};

// 디버그 패널 토글
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value;
  updateDebugInfo('environment', { host: window.location.hostname });
};

const handleKeyPress = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  keySequence.value += key;

  // 최근 5글자만 유지
  if (keySequence.value.length > 5) {
    keySequence.value = keySequence.value.slice(-5);
  }

  if (keySequence.value.includes('ddebb')) {
    showDebugButton.value = true;
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

// 지도 재시도 핸들러
const handleMapRetry = async () => {
  console.log('🔄 [PAGE] 지도 재시도 시작');
  gasStationStore.setMapError(false);
  gasStationStore.setMapLoaded(false);

  try {
    await initializeApp();
  } catch (error) {
    console.error('❌ [PAGE] 지도 재시도 실패:', error);
  }
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
    // 환경 정보 로깅 (개발 모드에서만)
    logEnvironmentInfo();

    // 전역 에러 핸들러 설정
    setupGlobalErrorHandlers();

    // 카카오맵 API 키 검증
    if (!isValidApiKey) {
      const errorMessage = '카카오맵 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.';
      console.error('❌ [KAKAO-API-KEY-ERROR]', errorMessage);
      gasStationStore.setError(errorMessage);
      gasStationStore.setMapError(true);
      return;
    }

    try {
      console.log('🚀 [INIT] 카카오맵 초기화 시작');
      await waitForKakaoMaps();
      console.log('✅ [INIT] 카카오맵 API 로드 완료');

      await initializeMap();
      console.log('✅ [INIT] 카카오맵 초기화 완료');

      gasStationStore.setMapLoaded(true);

      // 지도 초기화 완료 후 잠시 대기 (DOM 안정화)
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ [INIT] 전체 초기화 완료');
    } catch (error) {
      console.error('❌ [INIT] 초기화 실패:', error);
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

    // 전역 디버깅 함수 설정 (개발 모드에서만)
    setupDebugFunctions(allStations);

    // 가격 업데이트 정보 조회
    try {
      await fetchUpdateInfo();
    } catch (error) {
      console.error('❌ [INIT-ERROR] 가격 업데이트 정보 조회 실패:', error);
    }

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

onMounted(async () => {
  // 성능 측정 시작
  measureRender('gas-stations-page');
  startMonitoring();

  // 클라이언트에서만 실행
  if (import.meta.client) {
    // DOM이 완전히 준비될 때까지 대기
    await nextTick();

    // 추가 대기 시간 (Hydration 완료 보장)
    await new Promise(resolve => setTimeout(resolve, 100));

    // 앱 초기화
    await initializeApp();
  }

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



/* 모바일 하단 탭 스타일 */
.mobile-bottom-tabs {
  position: fixed;
  bottom: 0; /* 이제 광고가 레이아웃에 포함되므로 하단에 위치 */
  left: 0;
  right: 0;
  z-index: 45;
  pointer-events: none; /* 배경 클릭 방지 */
}

.mobile-tab-toggle {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  pointer-events: auto; /* 버튼은 클릭 가능 */
  z-index: 10; /* 탭 컨테이너보다 위에 표시 */
}

.mobile-tab-toggle.active {
  background: #f3f4f6;
  bottom: calc(50vh - 150px); /* 탭이 열린 상태에서 탭 컨테이너 위쪽에 위치 */
  max-height: 376px; /* max-height 400px - 24px */
}

.mobile-tabs-container {
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  transform: translateY(100%);
  transition: transform 0.3s ease;
  height: 30vh; /* 화면의 30% */
  max-height: 400px;
  overflow: hidden;
  pointer-events: auto; /* 탭 컨테이너는 클릭 가능 */
}

.mobile-tabs-container.open {
  transform: translateY(0);
}

.mobile-tabs-header {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 16px 16px 0 0;
}

.mobile-tab-button {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.mobile-tab-button.active {
  color: #3b82f6;
  background: white;
  border-bottom: 2px solid #3b82f6;
}

.mobile-tab-button:first-child.active {
  border-radius: 16px 0 0 0;
}

.mobile-tab-button:last-child.active {
  border-radius: 0 16px 0 0;
}

.mobile-tabs-content {
  height: calc(100% - 49px); /* 헤더 높이 제외 */
  overflow-y: auto;
  padding: 16px;
}

.mobile-tab-panel {
  height: 100%;
}

.mobile-station-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-station-item:hover {
  background: #f3f4f6;
}

.mobile-station-item.favorite {
  background: #fdf2f8;
}

.mobile-station-item.favorite:hover {
  background: #fce7f3;
}

.mobile-station-rank {
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.mobile-station-rank.favorite {
  background: #ec4899;
}

.mobile-station-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-station-address {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: keep-all;
}

.mobile-station-price {
  font-size: 14px;
  font-weight: bold;
  color: #ef4444;
  margin-bottom: 2px;
}

.mobile-station-price.favorite {
  color: #ec4899;
}

.mobile-station-distance {
  font-size: 12px;
  color: #6b7280;
}

.mobile-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

/* 모바일에서 추가 보장 */
@media (max-width: 768px) {

  /* 모바일에서 기존 우측 패널 숨기기 */
  .station-list-panel {
    display: none;
  }
}
</style>

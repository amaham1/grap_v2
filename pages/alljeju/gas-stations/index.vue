<template>
  <div class="bg-gray-50 gas-stations-page">
    <!-- 서버 사이드 로딩 상태 -->
    <div v-if="!isClientMounted" class="w-full flex items-center justify-center bg-gray-100 gas-stations-content">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">지도를 불러오는 중...</p>
      </div>
    </div>

    <!-- 클라이언트에서만 렌더링되는 지도 관련 컴포넌트들 -->
    <div v-else-if="isValidApiKey && isClientMounted" class="gas-stations-app gas-stations-content">
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

      <!-- 최저가 TOP 박스 (데스크톱 우측 상단) -->
      <div class="top-list-panel">
        <GasStationTopList
          :top-stations="topLowestPriceStations"
          :selected-fuel="selectedFuel"
          @station-click="handleStationClick" />
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
      <div class="relative w-full h-full">
        <GasStationMapContainer
          :is-map-loaded="isMapLoaded"
          :map-error="mapError"
          :is-searching="isSearching"
          @current-view-search="handleCurrentViewSearch"
          @retry="handleMapRetry" />

        <!-- 모바일 하단 슬라이드업 패널 (768px 이하에서만 표시) -->
        <GasStationMobileBottomPanel
          :top-lowest-price-stations="topLowestPriceStations"
          :favorite-top3-stations="favoriteTop3Stations"
          :selected-fuel="selectedFuel"
          @station-click="handleStationClick" />
      </div>

      <!-- 현재 위치 버튼 -->
      <GasStationLocationButton
        :is-getting-location="isGettingLocation"
        @get-current-location="handleGetCurrentLocation" />
    </div>

    <!-- API 키 오류 상태 -->
    <div v-else class="w-full flex items-center justify-center bg-gray-100 gas-stations-content">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <p class="text-gray-600 mb-2">카카오맵 API 키가 설정되지 않았습니다.</p>
        <p class="text-sm text-gray-500">관리자에게 문의하세요.</p>
      </div>
    </div>

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
const GasStationTopList = defineAsyncComponent(() => import('~/components/GasStation/TopList.vue'));
const GasStationLocationButton = defineAsyncComponent(() => import('~/components/GasStation/LocationButton.vue'));
const GasStationMobileBottomPanel = defineAsyncComponent(() => import('~/components/GasStation/MobileBottomPanel.vue'));


definePageMeta({
  layout: 'public',
  ssr: false // 클라이언트 전용 렌더링
});

const config = useRuntimeConfig();

// 카카오맵 API 키 확인 및 폴백 처리
const kakaoMapApiKey = config.public.kakaoMapApiKey;
const isValidApiKey = kakaoMapApiKey && kakaoMapApiKey !== 'f7c0b5b7e8a4c5d6e7f8a9b0c1d2e3f4';

// 카카오맵 API 키 검증

// SEO 최적화된 페이지 메타 정보 설정
useHead({
  title: '제주도 주유소 최저가 정보 | 실시간 유가 비교 - Grap',
  meta: [
    // 기본 메타 태그
    { name: 'description', content: '제주도 주유소 최저가 정보를 실시간으로 확인하세요. 카카오맵으로 내 주변 주유소 위치와 휘발유, 경유, LPG 가격을 한눈에 비교할 수 있습니다.' },
    { name: 'keywords', content: '제주도 주유소, 제주 주유소, 제주도 유가, 최저가 주유소, 제주 휘발유 가격, 제주 경유 가격, 제주 LPG 가격, 주유소 위치, 실시간 유가' },
    { name: 'author', content: 'Grap' },
    { name: 'robots', content: 'index, follow' },

    // Open Graph 메타 태그
    { property: 'og:title', content: '제주도 주유소 최저가 정보 | 실시간 유가 비교 - Grap' },
    { property: 'og:description', content: '제주도 주유소 최저가 정보를 실시간으로 확인하세요. 카카오맵으로 내 주변 주유소 위치와 휘발유, 경유, LPG 가격을 한눈에 비교할 수 있습니다.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://grap.co.kr/alljeju/gas-stations' },
    { property: 'og:site_name', content: 'Grap - 제주도 생활정보' },
    { property: 'og:locale', content: 'ko_KR' },

    // Twitter Card 메타 태그
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: '제주도 주유소 최저가 정보 | 실시간 유가 비교 - Grap' },
    { name: 'twitter:description', content: '제주도 주유소 최저가 정보를 실시간으로 확인하세요. 카카오맵으로 내 주변 주유소 위치와 휘발유, 경유, LPG 가격을 한눈에 비교할 수 있습니다.' },

    // 지역 SEO
    { name: 'geo.region', content: 'KR-49' }, // 제주특별자치도
    { name: 'geo.placename', content: '제주특별자치도' },
    { name: 'geo.position', content: '33.3617;126.5292' }, // 제주도 중심 좌표
    { name: 'ICBM', content: '33.3617, 126.5292' }
  ],
  script: [
    // 카카오맵 스크립트
    ...(isValidApiKey ? [{
      src: `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false`,
      defer: true
    }] : []),
    // 구조화된 데이터 (JSON-LD)
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: '제주도 주유소 최저가 정보',
        description: '제주도 주유소 최저가 정보를 실시간으로 확인하세요. 카카오맵으로 내 주변 주유소 위치와 휘발유, 경유, LPG 가격을 한눈에 비교할 수 있습니다.',
        url: 'https://grap.co.kr/alljeju/gas-stations',
        mainEntity: {
          '@type': 'Service',
          name: '제주도 주유소 정보 서비스',
          description: '제주도 내 모든 주유소의 실시간 가격 정보와 위치를 제공하는 서비스',
          provider: {
            '@type': 'Organization',
            name: 'Grap',
            url: 'https://grap.co.kr'
          },
          areaServed: {
            '@type': 'State',
            name: '제주특별자치도',
            containedInPlace: {
              '@type': 'Country',
              name: '대한민국'
            }
          },
          serviceType: '주유소 정보 제공',
          category: '교통 및 연료'
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: '홈',
              item: 'https://grap.co.kr/alljeju'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: '최저가 주유소',
              item: 'https://grap.co.kr/alljeju/gas-stations'
            }
          ]
        }
      })
    }
  ]
});

// Pinia 스토어 사용
const gasStationStore = useGasStationStore();
const { handleApiError, withErrorHandling, setupGlobalErrorHandlers } = useErrorHandler();
const { measureFunction, measureRender, startMonitoring, stopMonitoring } = usePerformance();
const { generateGasStationStructuredData, generateJejuRegionKeywords, addStructuredData } = useSEO();

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
const isClientMounted = ref(false); // 클라이언트 마운트 상태



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

      // SEO: 구조화된 데이터 및 동적 키워드 추가
      if (stations.length > 0) {
        const structuredData = generateGasStationStructuredData(stations);
        if (structuredData) {
          addStructuredData(structuredData);
        }

        // 동적 키워드 업데이트
        const dynamicKeywords = generateJejuRegionKeywords(stations);
        useHead({
          meta: [
            { name: 'keywords', content: dynamicKeywords }
          ]
        });
      }
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

      // SEO: 구조화된 데이터 및 동적 키워드 추가
      if (stations.length > 0) {
        const structuredData = generateGasStationStructuredData(stations);
        if (structuredData) {
          addStructuredData(structuredData);
        }

        // 동적 키워드 업데이트
        const dynamicKeywords = generateJejuRegionKeywords(stations);
        useHead({
          meta: [
            { name: 'keywords', content: dynamicKeywords }
          ]
        });
      }
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
  // 클라이언트에서만 실행
  if (!import.meta.client) {
    console.warn('⚠️ [INIT] 서버 사이드에서 초기화 시도됨 - 무시');
    return;
  }

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

    // 헤더 높이 계산 및 적용
    const adjustLayoutForHeader = () => {
      const header = document.querySelector('header');
      if (header) {
        const headerHeight = header.offsetHeight;
        const gasStationsContent = document.querySelector('.gas-stations-content') as HTMLElement;
        if (gasStationsContent) {
          gasStationsContent.style.top = `${headerHeight}px`;
        }
        console.log('📏 [LAYOUT] 헤더 높이 적용:', headerHeight + 'px');
      }
    };

    // 클라이언트 마운트 상태 설정
    isClientMounted.value = true;

    // 헤더 높이 조정
    adjustLayoutForHeader();

    // 추가 대기 시간 (Hydration 완료 보장)
    await new Promise(resolve => setTimeout(resolve, 200));

    // 헤더 높이 재조정 (폰트 로딩 등으로 인한 변화 대응)
    adjustLayoutForHeader();

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
/* 주유소 페이지 전체 레이아웃 */
.gas-stations-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.gas-stations-content {
  position: absolute;
  top: 60px; /* 헤더 고정 높이 */
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.gas-stations-app {
  width: 100%;
  height: calc(100% - 53px);
  position: relative;
}

/* 검색 패널 스타일 */
.search-panel {
  position: absolute;
  top: 5rem; /* top-20 */
  left: 0.5rem; /* left-2 */
  z-index: 40;
  width: 100%;
  max-width: 20rem; /* max-w-xs */
}

/* 최저가 TOP 박스 패널 스타일 */
.top-list-panel {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 41;
  width: 100%;
  max-width: 20rem;
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

  .top-list-panel {
    width: 20rem; /* md:w-80 */
    max-width: none;
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

  .top-list-panel {
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

  .top-list-panel {
    top: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    max-width: calc(100% - 1rem);
  }

  .station-list-panel {
    top: 12rem; /* TopList와 검색 패널 아래로 이동 */
    left: 0.5rem;
    right: 0.5rem;
    max-width: calc(100% - 1rem);
  }
}





/* 모바일에서 기존 TOP 박스들 숨기기 (새로운 하단 패널 사용) */
@media (max-width: 768px) {
  .gas-stations-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  .gas-stations-content {
    position: absolute;
    top: 60px; /* 헤더 고정 높이 */
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  .top-list-panel {
    display: none;
  }

  .station-list-panel {
    display: none;
  }
}
</style>

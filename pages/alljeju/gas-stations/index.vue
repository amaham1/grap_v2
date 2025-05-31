<template>
  <div class="gas-stations-page">


    <!-- 검색 설정 패널 -->
    <div class="absolute top-20 left-2 z-40 bg-white rounded-lg shadow-lg max-w-md border border-gray-300">
      <div class="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700">검색 설정</h3>
        <button
          @click="isSearchPanelCollapsed = !isSearchPanelCollapsed"
          class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': !isSearchPanelCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      <div v-show="!isSearchPanelCollapsed" class="p-3 space-y-4">
        <!-- 위치 정보 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">내 위치 기준 검색</span>
            <button
              @click="handleGetCurrentLocation"
              :disabled="isGettingLocation"
              class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
              {{ isGettingLocation ? '위치 확인 중...' : '현재 위치' }}
            </button>
          </div>
          <div v-if="userLocation" class="text-xs text-gray-600">
            위도: {{ userLocation.latitude.toFixed(6) }}, 경도: {{ userLocation.longitude.toFixed(6) }}
          </div>
        </div>

        <!-- 반경 설정 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            검색 반경: {{ searchRadius }}km
          </label>
          <input
            v-model="searchRadius"
            type="range"
            min="1"
            max="10"
            step="0.5"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>1km</span>
            <span>10km</span>
          </div>
        </div>

        <!-- 연료 타입 필터 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">연료 종류</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="fuel in fuelTypes"
              :key="fuel.value"
              @click="selectedFuel = selectedFuel === fuel.value ? '' : fuel.value"
              :class="[
                'px-3 py-1 text-xs rounded-full border transition-colors flex-shrink-0',
                selectedFuel === fuel.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              ]">
              {{ fuel.label }}
            </button>
          </div>
        </div>

        <!-- 검색 버튼 -->
        <button
          @click="handleNearbySearch"
          :disabled="!userLocation || isSearching"
          class="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 text-sm font-medium">
          {{ isSearching ? '검색 중...' : '주변 주유소 검색' }}
        </button>

        <!-- 검색 결과 요약 -->
        <div v-if="searchStats" class="text-xs text-gray-600">
          반경 {{ searchRadius }}km 내 {{ searchStats.total_in_radius }}개 주유소 발견
          <span v-if="searchStats.lowest_price_count > 0" class="text-green-600 font-medium">
            (최저가 {{ searchStats.lowest_price_count }}개)
          </span>
        </div>
      </div>
    </div>

    <!-- 최저가 주유소 TOP10 목록 -->
    <div v-if="topLowestPriceStations.length > 0" class="absolute top-20 right-2 z-40 bg-white rounded-lg shadow-lg w-72 md:w-80 border border-gray-300">
      <div class="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 flex items-center">
          🏆 최저가 TOP{{ Math.min(topLowestPriceStations.length, 10) }}
          <span v-if="selectedFuel" class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {{ fuelTypes.find(f => f.value === selectedFuel)?.label }}
          </span>
        </h3>
        <button
          @click="isTopListPanelCollapsed = !isTopListPanelCollapsed"
          class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': !isTopListPanelCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      <div v-show="!isTopListPanelCollapsed" class="p-3 max-h-80 md:max-h-96 overflow-y-auto">
        <div class="space-y-2">
          <div
            v-for="(station, index) in topLowestPriceStations.slice(0, 10)"
            :key="station.opinet_id"
            @click="handleStationClick(station)"
            class="p-2 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-blue-600">{{ index + 1 }}위</span>
                  <h4 class="text-sm font-medium text-gray-900 truncate">{{ station.name }}</h4>
                </div>
                <p class="text-xs text-gray-600 truncate">{{ station.brand?.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ station.address }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-sm font-bold text-green-600">
                    {{ formatPrice(getStationPrice(station, selectedFuel)) }}원/L
                  </span>
                  <span v-if="station.distance" class="text-xs text-gray-500">
                    📍 {{ station.distance.toFixed(1) }}km
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 카카오맵 컨테이너 -->
    <GasStationMapContainer
      :is-map-loaded="isMapLoaded"
      :map-error="mapError"
      :is-searching="isSearching"
      @current-view-search="handleCurrentViewSearch" />

    <!-- 하단 광고 블록 -->
    <div class="fixed bottom-0 left-0 right-0 w-full h-[50px] bg-white border-t border-gray-300 flex items-center justify-center z-50 px-2">
      <GoogleAdsense
        format="horizontal"
        width="100%"
        height="50px"
        full-width-responsive="true"
        container-class="w-full h-full flex items-center justify-center" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GasStation } from '~/types/gasStation';
import { updateTopLowestPriceStations, fuelTypes, formatPrice, getStationPrice } from '~/utils/gasStationUtils';
import GasStationMapContainer from '~/components/GasStation/MapContainer.vue';
import GoogleAdsense from '~/components/public/GoogleAdsense.vue';

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

// 컴포저블 사용
const { userLocation, isGettingLocation, getCurrentLocation } = useUserLocation();
const { isSearching, searchStats, searchNearbyStations, searchCurrentViewStations } = useGasStationSearch();
const { map, isMapLoaded, mapError, initializeMap, waitForKakaoMaps, moveMapCenter } = useKakaoMap();
const { clearMarkers, addUserLocationMarker, addGasStationMarkers, moveToStation, closeCurrentInfoWindow } = useGasStationMarkers(map);

// 상태 관리
const searchRadius = ref(2); // 기본 2km
const selectedFuel = ref('gasoline'); // 기본값을 휘발유로 설정
const topLowestPriceStations = ref<GasStation[]>([]);
const isInitialLoad = ref(true); // 최초 로드 여부
const isSearchPanelCollapsed = ref(true); // 검색 패널 접힌 상태
const isTopListPanelCollapsed = ref(true); // TOP10 패널 접힌 상태

// 이벤트 핸들러
const handleGetCurrentLocation = async () => {
  try {
    const location = await getCurrentLocation(false);
    if (location && map.value) {
      moveMapCenter(location.latitude, location.longitude, 5);
      addUserLocationMarker(location);
    }
  } catch (error) {
    console.error('위치 가져오기 실패:', error);
  }
};

const handleNearbySearch = async () => {
  if (!userLocation.value) {
    alert('먼저 현재 위치를 확인해주세요.');
    return;
  }

  try {
    // 🔍 [PAGE-DEBUG] 주변 검색 시작
    console.log(`🔍 [PAGE-NEARBY-DEBUG] 주변 검색 시작:`, {
      userLocation: userLocation.value,
      searchRadius: searchRadius.value,
      selectedFuel: selectedFuel.value,
      timestamp: new Date().toISOString()
    });

    clearMarkers();

    const stations = await searchNearbyStations(
      userLocation.value.latitude,
      userLocation.value.longitude,
      searchRadius.value,
      selectedFuel.value
    );

    // 🎯 [PAGE-RESULT-DEBUG] 검색 결과 분석
    console.log(`🎯 [PAGE-NEARBY-RESULT-DEBUG] 주변 검색 결과:`, {
      stationsFound: stations.length,
      searchRadius: searchRadius.value,
      selectedFuel: selectedFuel.value,
      hasUserLocation: !!userLocation.value,
      userLocation: userLocation.value
    });

    addGasStationMarkers(stations, selectedFuel.value);

    if (userLocation.value) {
      addUserLocationMarker(userLocation.value);
    }

    if (stations.length === 0) {
      console.warn(`⚠️ [PAGE-WARNING] 검색 반경 ${searchRadius.value}km 내에 주유소가 없습니다.`);
    }

    // 최저가 TOP10 목록 업데이트
    topLowestPriceStations.value = updateTopLowestPriceStations(stations, selectedFuel.value);
  } catch (error) {
    console.error('❌ [PAGE-ERROR] 주유소 검색 중 오류:', error);
    alert('주유소 검색 중 오류가 발생했습니다.');
  }
};

const handleCurrentViewSearch = async () => {
  if (!map.value) {
    alert('지도가 로드되지 않았습니다.');
    return;
  }

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

    // 최저가 TOP10 목록 업데이트
    topLowestPriceStations.value = updateTopLowestPriceStations(stations, selectedFuel.value);
  } catch (error) {
    console.error('주유소 검색 중 오류:', error);
    alert('주유소 검색 중 오류가 발생했습니다.');
  }
};

const handleStationClick = (station: GasStation) => {
  moveToStation(station);
};

// 환경 정보 디버깅 함수
const logEnvironmentInfo = () => {
  console.log(`🌐 [ENV-INFO-DEBUG] 환경 정보 상세:`, {
    // 브라우저 정보
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,

    // 위치 정보
    geolocationSupported: !!navigator.geolocation,

    // 페이지 정보
    url: window.location.href,
    host: window.location.host,
    protocol: window.location.protocol,

    // 시간 정보
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // 화면 정보
    screenWidth: screen.width,
    screenHeight: screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,

    // 기타
    referrer: document.referrer
  });
};

// 초기화 및 자동 검색
const initializeApp = async () => {
  try {
    // 🌐 [DEBUG] 환경 정보 로깅
    logEnvironmentInfo();

    await waitForKakaoMaps();
    await initializeMap();

    // 전역 함수 설정 (인포윈도우 닫기용)
    window.closeInfoWindow = () => {
      closeCurrentInfoWindow();
    };

    // 🔧 [DEBUG] 전역 디버깅 함수 설정
    window.debugGasStations = {
      // 환경 정보 출력
      logEnv: () => logEnvironmentInfo(),

      // 현재 상태 정보 출력
      logCurrentState: () => {
        console.log(`🔍 [CURRENT-STATE-DEBUG] 현재 상태:`, {
          userLocation: userLocation.value,
          searchRadius: searchRadius.value,
          selectedFuel: selectedFuel.value,
          isSearching: isSearching.value,
          isMapLoaded: isMapLoaded.value,
          searchStats: searchStats.value,
          topStationsCount: topLowestPriceStations.value.length,
          markersCount: currentMarkers.value.length
        });
      },

      // 강제 재검색
      forceSearch: () => {
        console.log(`🔄 [FORCE-SEARCH-DEBUG] 강제 재검색 시작`);
        handleNearbySearch();
      },

      // 환경 비교 (로컬 vs 배포)
      compareEnvironment: () => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isProduction = window.location.hostname === 'grap.co.kr';

        console.log(`🔄 [ENV-COMPARE-DEBUG] 환경 비교:`, {
          currentHost: window.location.hostname,
          isLocal,
          isProduction,
          protocol: window.location.protocol,
          port: window.location.port,
          userAgent: navigator.userAgent.substring(0, 100) + '...'
        });
      }
    };

    // 최초 로드시 자동으로 현재 위치 가져오기
    if (isInitialLoad.value) {
      isInitialLoad.value = false;
      try {
        const location = await getCurrentLocation(true);
        if (location && map.value) {
          moveMapCenter(location.latitude, location.longitude, 5);
          addUserLocationMarker(location);

          // 자동으로 주변 주유소 검색
          await handleNearbySearch();
        }
      } catch (error) {
        console.error('❌ [INIT-ERROR] 자동 위치 확인 실패:', error);
      }
    }
  } catch (error) {
    console.error('❌ [INIT-ERROR] 앱 초기화 실패:', error);
  }
};

// 연료 타입 변경 감지하여 재검색
watch(selectedFuel, () => {
  if (searchStats.value && searchStats.value.total_in_radius > 0) {
    // 현재 검색 결과가 있으면 다시 검색
    handleNearbySearch();
  }
});

onMounted(() => {
  initializeApp();
});

onUnmounted(() => {
  if (window.closeInfoWindow) {
    delete window.closeInfoWindow;
  }
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
    };
  }
}
</script>

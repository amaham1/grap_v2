<template>
  <div class="gas-stations-page">
    <!-- 필터 컨트롤 패널 -->
    <div class="absolute top-2 left-2 z-40 bg-white rounded-lg shadow-lg max-w-md">
      <!-- 패널 헤더 (항상 표시) -->
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

      <!-- 패널 내용 (접을 수 있음) -->
      <div v-show="!isSearchPanelCollapsed" class="p-3 space-y-4">
        <!-- 위치 정보 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">내 위치 기준 검색</span>
            <button
              @click="() => getCurrentLocation(false)"
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
          @click="searchNearbyStations"
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
    <div v-if="topLowestPriceStations.length > 0" class="absolute top-2 right-2 z-40 bg-white rounded-lg shadow-lg w-72 md:w-80">
      <!-- 패널 헤더 (항상 표시) -->
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

      <!-- 패널 내용 (접을 수 있음) -->
      <div v-show="!isTopListPanelCollapsed" class="p-3 max-h-80 md:max-h-96 overflow-y-auto">
        <div class="space-y-2">
          <div
            v-for="(station, index) in topLowestPriceStations.slice(0, 10)"
            :key="station.opinet_id"
            @click="moveToStation(station)"
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
                    {{ formatPrice(getStationPrice(station)) }}원/L
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
    <div id="map" class="w-full h-[calc(100vh-114px)] relative">
      <!-- 로딩 상태 -->
      <div v-if="!isMapLoaded && !mapError" class="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>

      <!-- 에러 상태 -->
      <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div class="text-center">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <p class="text-gray-600 mb-2">지도를 불러올 수 없습니다.</p>
          <p class="text-sm text-gray-500">카카오맵 API 키를 확인해주세요.</p>
        </div>
      </div>

      <!-- 현 위치에서 검색 버튼 -->
      <div v-if="isMapLoaded" class="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30">
        <button
          @click="searchCurrentViewStations"
          :disabled="isSearching"
          class="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          {{ isSearching ? '검색 중...' : '현 위치에서 검색' }}
        </button>
      </div>
    </div>

    <!-- 하단 광고 블록 -->
    <div class="fixed bottom-0 left-0 right-0 w-full h-[50px] bg-gray-200 border-t border-gray-300 flex items-center justify-center z-50">
      <div class="text-center text-gray-500 text-sm">
        <span>광고 - 100% x 50px</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

let map: any = null;
const isMapLoaded = ref(false);
const mapError = ref(false);

// 위치 및 검색 관련 상태
const userLocation = ref<{ latitude: number; longitude: number } | null>(null);
const isGettingLocation = ref(false);
const searchRadius = ref(2); // 기본 2km로 변경
const selectedFuel = ref('gasoline'); // 기본값을 휘발유로 설정
const isSearching = ref(false);
const searchStats = ref<any>(null);
const currentMarkers = ref<any[]>([]);
const topLowestPriceStations = ref<any[]>([]);
const isInitialLoad = ref(true); // 최초 로드 여부
const currentOpenInfoWindow = ref<any>(null); // 현재 열린 인포윈도우 추적

// 패널 접기/펼치기 상태
const isSearchPanelCollapsed = ref(true); // 검색 패널 기본 접힌 상태
const isTopListPanelCollapsed = ref(true); // TOP10 패널 기본 접힌 상태

// 연료 타입 옵션
const fuelTypes = [
  { value: '', label: '전체' },
  { value: 'gasoline', label: '휘발유' },
  { value: 'diesel', label: '경유' },
  { value: 'lpg', label: 'LPG' }
];

// 가격 포맷팅 함수
const formatPrice = (price: number): string => {
  if (!price || price <= 0) return '정보없음';
  return price.toLocaleString();
};

// 주유소의 선택된 연료 가격 가져오기
const getStationPrice = (station: any): number => {
  if (!station.prices) return 0;

  switch (selectedFuel.value) {
    case 'gasoline':
      return station.prices.gasoline || 0;
    case 'diesel':
      return station.prices.diesel || 0;
    case 'lpg':
      return station.prices.lpg || 0;
    default:
      return station.prices.gasoline || station.prices.diesel || station.prices.lpg || 0;
  }
};

// 주유소로 지도 이동
const moveToStation = (station: any) => {
  if (!map || !station.location?.latitude || !station.location?.longitude) {
    console.error('지도 또는 주유소 위치 정보가 없습니다.');
    return;
  }

  const position = new window.kakao.maps.LatLng(
    station.location.latitude,
    station.location.longitude
  );

  // 지도 중심을 주유소 위치로 이동
  map.setCenter(position);
  map.setLevel(3); // 줌 레벨을 3으로 설정 (더 가깝게)

  // 해당 주유소의 마커를 찾아서 인포윈도우 열기
  const targetMarker = currentMarkers.value.find(marker => {
    const markerPosition = marker.getPosition();
    return Math.abs(markerPosition.getLat() - station.location.latitude) < 0.0001 &&
           Math.abs(markerPosition.getLng() - station.location.longitude) < 0.0001;
  });

  if (targetMarker) {
    // 마커 클릭 이벤트 트리거
    window.kakao.maps.event.trigger(targetMarker, 'click');
  }
};

// 현재 위치 가져오기
const getCurrentLocation = (isAutomatic = false) => {
  if (!navigator.geolocation) {
    if (!isAutomatic) {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    }
    return;
  }

  isGettingLocation.value = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      isGettingLocation.value = false;

      // 지도 중심을 사용자 위치로 이동
      if (map && userLocation.value) {
        const userPosition = new window.kakao.maps.LatLng(
          userLocation.value.latitude,
          userLocation.value.longitude
        );
        map.setCenter(userPosition);
        map.setLevel(5); // 줌 레벨 조정

        // 사용자 위치 마커 추가
        addUserLocationMarker();

        // 최초 로드시 자동으로 주변 주유소 검색
        if (isInitialLoad.value) {
          isInitialLoad.value = false;
          await searchNearbyStations();
        }
      }
    },
    (error) => {
      console.error('위치 정보를 가져올 수 없습니다:', error);
      if (!isAutomatic) {
        alert('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
      }
      isGettingLocation.value = false;

      // 위치 정보를 가져올 수 없는 경우 기본 주유소 데이터 로드
      if (isInitialLoad.value) {
        isInitialLoad.value = false;
        addGasStationMarkers();
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5분
    }
  );
};

// UTF-8 문자열을 Base64로 안전하게 인코딩하는 함수
const encodeToBase64 = (str: string): string => {
  try {
    // 한글 등 유니코드 문자를 안전하게 처리
    // TextEncoder를 사용하여 UTF-8 바이트 배열로 변환 후 Base64 인코딩
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  } catch (error) {
    console.error('Base64 인코딩 실패:', error);
    // 폴백: 간단한 텍스트로 대체
    return btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="2"/></svg>');
  }
};

// 사용자 위치 마커 추가
const addUserLocationMarker = () => {
  if (!map || !userLocation.value) return;

  const userPosition = new window.kakao.maps.LatLng(
    userLocation.value.latitude,
    userLocation.value.longitude
  );

  // 사용자 위치 마커 (특별한 아이콘 사용)
  const userMarker = new window.kakao.maps.Marker({
    position: userPosition,
    map: map,
    image: new window.kakao.maps.MarkerImage(
      'data:image/svg+xml;base64,' + encodeToBase64(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3B82F6">
          <circle cx="12" cy="12" r="8" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      `),
      new window.kakao.maps.Size(24, 24),
      { offset: new window.kakao.maps.Point(12, 12) }
    )
  });

  // 사용자 위치 정보창
  const userInfoWindow = new window.kakao.maps.InfoWindow({
    content: `
      <div style="padding:8px; text-align:center;">
        <strong style="color:#3B82F6;">내 위치</strong>
      </div>
    `
  });

  // 마커 클릭 시 정보창 표시
  window.kakao.maps.event.addListener(userMarker, 'click', () => {
    userInfoWindow.open(map, userMarker);
  });
};

// 주변 주유소 검색
const searchNearbyStations = async () => {
  if (!userLocation.value) {
    alert('먼저 현재 위치를 확인해주세요.');
    return;
  }

  isSearching.value = true;

  try {
    // 기존 마커들 제거
    clearMarkers();

    const queryParams = new URLSearchParams({
      lat: userLocation.value.latitude.toString(),
      lng: userLocation.value.longitude.toString(),
      radius: searchRadius.value.toString(),
      pageSize: '100',
      sortBy: 'distance',
      sortOrder: 'asc'
    });

    if (selectedFuel.value) {
      queryParams.append('fuel', selectedFuel.value);
    }

    const response = await $fetch(`/api/public/gas-stations?${queryParams.toString()}`);

    if (response.success) {
      searchStats.value = response.stats;

      // 주유소 마커들 추가
      addGasStationMarkersFromData(response.items);

      // 사용자 위치 마커도 다시 추가
      addUserLocationMarker();

      // 최저가 TOP10 목록 업데이트
      updateTopLowestPriceStations(response.items);
    }

  } catch (error) {
    console.error('주유소 검색 중 오류:', error);
    alert('주유소 검색 중 오류가 발생했습니다.');
  } finally {
    isSearching.value = false;
  }
};

// 현재 지도 중심점에서 주유소 검색
const searchCurrentViewStations = async () => {
  if (!map) {
    alert('지도가 로드되지 않았습니다.');
    return;
  }

  isSearching.value = true;

  try {
    // 현재 지도 중심점 가져오기
    const center = map.getCenter();
    const currentLat = center.getLat();
    const currentLng = center.getLng();

    // 기존 마커들 제거
    clearMarkers();

    const queryParams = new URLSearchParams({
      lat: currentLat.toString(),
      lng: currentLng.toString(),
      radius: searchRadius.value.toString(),
      pageSize: '100',
      sortBy: 'distance',
      sortOrder: 'asc'
    });

    if (selectedFuel.value) {
      queryParams.append('fuel', selectedFuel.value);
    }

    const response = await $fetch(`/api/public/gas-stations?${queryParams.toString()}`);

    if (response.success) {
      searchStats.value = response.stats;

      // 주유소 마커들 추가
      addGasStationMarkersFromData(response.items);

      // 사용자 위치 마커도 다시 추가 (사용자 위치가 있는 경우)
      if (userLocation.value) {
        addUserLocationMarker();
      }

      // 최저가 TOP10 목록 업데이트
      updateTopLowestPriceStations(response.items);
    }

  } catch (error) {
    console.error('주유소 검색 중 오류:', error);
    alert('주유소 검색 중 오류가 발생했습니다.');
  } finally {
    isSearching.value = false;
  }
};

// 최저가 TOP10 목록 업데이트
const updateTopLowestPriceStations = (stations: any[]) => {
  if (!selectedFuel.value || !stations.length) {
    topLowestPriceStations.value = [];
    return;
  }

  // 선택된 연료 타입의 가격이 있는 주유소만 필터링
  const stationsWithPrice = stations.filter(station => {
    if (!station.prices) return false;

    switch (selectedFuel.value) {
      case 'gasoline':
        return station.prices.gasoline > 0;
      case 'diesel':
        return station.prices.diesel > 0;
      case 'lpg':
        return station.prices.lpg > 0;
      default:
        return false;
    }
  });

  // 가격순으로 정렬
  const sortedStations = stationsWithPrice.sort((a, b) => {
    const priceA = getStationPrice(a);
    const priceB = getStationPrice(b);
    return priceA - priceB;
  });

  // TOP10 저장
  topLowestPriceStations.value = sortedStations.slice(0, 10);
};

// 현재 열린 인포윈도우 닫기
const closeCurrentInfoWindow = () => {
  if (currentOpenInfoWindow.value) {
    currentOpenInfoWindow.value.close();
    currentOpenInfoWindow.value = null;
  }
};

// 마커 제거
const clearMarkers = () => {
  // 인포윈도우도 함께 닫기
  closeCurrentInfoWindow();

  currentMarkers.value.forEach(marker => {
    marker.setMap(null);
  });
  currentMarkers.value = [];
};

onMounted(() => {
  // 전역 함수 설정 (인포윈도우 닫기용)
  window.closeInfoWindow = () => {
    closeCurrentInfoWindow();
  };

  // 카카오맵 API 로드 대기
  let attempts = 0;
  const maxAttempts = 50; // 5초 대기

  const checkKakao = () => {
    attempts++;

    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else if (attempts < maxAttempts) {
      setTimeout(checkKakao, 100);
    } else {
      mapError.value = true;
      console.error('카카오맵 API 로드 실패');
    }
  };

  checkKakao();
});

// 컴포넌트 언마운트시 전역 함수 정리
onUnmounted(() => {
  if (window.closeInfoWindow) {
    delete window.closeInfoWindow;
  }
});

const initializeMap = () => {
  console.log('[DEBUG] 지도 초기화 시작');

  window.kakao.maps.load(() => {
    try {
      console.log('[DEBUG] 카카오맵 API 로드 완료');

      const container = document.getElementById('map');
      console.log('[DEBUG] 지도 컨테이너 요소:', container);

      if (!container) {
        throw new Error('지도 컨테이너를 찾을 수 없습니다.');
      }

      const options = {
        center: new window.kakao.maps.LatLng(33.3617, 126.5292), // 제주도 중심 좌표 (임시)
        level: 9 // 지도 확대 레벨
      };

      console.log('[DEBUG] 지도 옵션:', options);

      // 지도 생성
      map = new window.kakao.maps.Map(container, options);
      console.log('[DEBUG] 지도 객체 생성 완료:', map);

      // 지도 타입 컨트롤 추가
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

      // 줌 컨트롤 추가
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

      console.log('[DEBUG] 지도 컨트롤 추가 완료');

      // 지도 로딩 완료
      isMapLoaded.value = true;
      console.log('[DEBUG] 지도 초기화 완료');

      // 최초 로드시 자동으로 현재 위치 가져오기
      console.log('[DEBUG] 자동 위치 확인 시작');
      getCurrentLocation(true);

    } catch (error) {
      console.error('[ERROR] 지도 초기화 오류:', error);
      mapError.value = true;
    }
  });
};

// 검색된 주유소 데이터로 마커 추가
const addGasStationMarkersFromData = (gasStations: any[]) => {
  console.log(`[DEBUG] 마커 생성 시작: ${gasStations.length}개 주유소`);

  if (!map) {
    console.error('[ERROR] 지도 객체가 없습니다. 마커를 생성할 수 없습니다.');
    return;
  }

  let markersCreated = 0;
  let markersSkipped = 0;

  gasStations.forEach((station, index) => {
    // 좌표가 있는 주유소만 마커 생성
    if (station.location?.latitude && station.location?.longitude) {
      console.log(`[DEBUG] 마커 생성 중 ${index + 1}/${gasStations.length}: ${station.name} (${station.location.latitude}, ${station.location.longitude})`);

      try {
        const position = new window.kakao.maps.LatLng(
          station.location.latitude,
          station.location.longitude
        );

        // 최저가 주유소인지 확인
        const isLowestPrice = station.is_lowest_price;

        // 마커 이미지 설정 (최저가는 특별 마커)
        let markerImage = null;
        if (isLowestPrice) {
          markerImage = new window.kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' + encodeToBase64(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
                  </filter>
                </defs>
                <circle cx="20" cy="20" r="18" fill="#FFD700" stroke="#FF6B35" stroke-width="3" filter="url(#shadow)"/>
                <circle cx="20" cy="20" r="12" fill="#FF6B35"/>
                <text x="20" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="bold">🏆</text>
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="7" font-weight="bold">최저가</text>
              </svg>
            `),
            new window.kakao.maps.Size(40, 40),
            { offset: new window.kakao.maps.Point(20, 20) }
          );
        } else {
          // 일반 주유소 마커
          markerImage = new window.kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' + encodeToBase64(`
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="12" fill="#3B82F6" stroke="white" stroke-width="2"/>
                <text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">⛽</text>
              </svg>
            `),
            new window.kakao.maps.Size(28, 28),
            { offset: new window.kakao.maps.Point(14, 14) }
          );
        }

        // 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: position,
          map: map,
          image: markerImage
        });

        // 마커가 실제로 지도에 추가되었는지 확인
        const markerMap = marker.getMap();
        const markerPosition = marker.getPosition();

        console.log(`[DEBUG] 마커 생성 성공: ${station.name}`);
        console.log(`[DEBUG] 마커 지도 연결 상태:`, markerMap ? '연결됨' : '연결 안됨');
        console.log(`[DEBUG] 마커 위치:`, markerPosition ? `(${markerPosition.getLat()}, ${markerPosition.getLng()})` : '위치 없음');
        console.log(`[DEBUG] 지도 객체 상태:`, map ? '정상' : '없음');
        console.log(`[DEBUG] 지도 중심점:`, map ? `(${map.getCenter().getLat()}, ${map.getCenter().getLng()})` : '없음');
        console.log(`[DEBUG] 지도 줌 레벨:`, map ? map.getLevel() : '없음');

        // 마커를 배열에 저장 (나중에 제거하기 위해)
        currentMarkers.value.push(marker);
        markersCreated++;

        // 선택된 연료의 가격만 표시
        let mainPriceInfo = '';
        let currentPrice = 0;

        if (station.prices) {
          switch (selectedFuel.value) {
            case 'gasoline':
              if (station.prices.gasoline > 0) {
                currentPrice = station.prices.gasoline;
                mainPriceInfo = `<div style="color:#e74c3c; font-weight:bold; font-size:14px;">휘발유 ${currentPrice.toLocaleString()}원/L</div>`;
              }
              break;
            case 'diesel':
              if (station.prices.diesel > 0) {
                currentPrice = station.prices.diesel;
                mainPriceInfo = `<div style="color:#27ae60; font-weight:bold; font-size:14px;">경유 ${currentPrice.toLocaleString()}원/L</div>`;
              }
              break;
            case 'lpg':
              if (station.prices.lpg > 0) {
                currentPrice = station.prices.lpg;
                mainPriceInfo = `<div style="color:#3498db; font-weight:bold; font-size:14px;">LPG ${currentPrice.toLocaleString()}원/L</div>`;
              }
              break;
            default:
              // 전체 선택시 가장 저렴한 가격 표시
              const prices = [
                { type: '휘발유', price: station.prices.gasoline, color: '#e74c3c' },
                { type: '경유', price: station.prices.diesel, color: '#27ae60' },
                { type: 'LPG', price: station.prices.lpg, color: '#3498db' }
              ].filter(p => p.price > 0);

              if (prices.length > 0) {
                const cheapest = prices.reduce((min, p) => p.price < min.price ? p : min);
                currentPrice = cheapest.price;
                mainPriceInfo = `<div style="color:${cheapest.color}; font-weight:bold; font-size:14px;">${cheapest.type} ${cheapest.price.toLocaleString()}원/L</div>`;
              }
          }
        }

        if (!mainPriceInfo) {
          mainPriceInfo = '<div style="color:#95a5a6; font-size:12px;">가격 정보 없음</div>';
        }

        // 최저가 표시
        const lowestPriceTag = isLowestPrice
          ? `<div style="background:#10B981; color:white; padding:3px 8px; border-radius:12px; font-size:10px; margin:4px 0; display:inline-block;">🏆 최저가</div>`
          : '';

        // 거리 정보
        const distanceInfo = station.distance
          ? `<div style="color:#666; font-size:11px; margin-top:4px;">📍 ${station.distance.toFixed(1)}km</div>`
          : '';

        // 인포윈도우 내용 (최적화된 크기)
        const infoContent = `
          <div style="padding:8px; width:200px; position:relative;">
            <button onclick="window.closeInfoWindow && window.closeInfoWindow()" style="position:absolute; top:4px; right:4px; background:none; border:none; font-size:16px; cursor:pointer; color:#999; padding:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center;">×</button>
            <div style="margin-right:20px;">
              <h4 style="margin:0 0 4px 0; font-weight:bold; font-size:13px; line-height:1.2;">${station.name}</h4>
              <div style="margin:0 0 4px 0; color:#666; font-size:10px;">${station.brand?.name || ''}</div>
              ${lowestPriceTag}
              ${mainPriceInfo}
              ${distanceInfo}
            </div>
          </div>
        `;

        const infowindow = new window.kakao.maps.InfoWindow({
          content: infoContent
        });

        console.log(`[DEBUG] 인포윈도우 생성 완료: ${station.name}`);

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          console.log(`[DEBUG] 마커 클릭됨: ${station.name}`);

          // 기존 열린 인포윈도우 닫기
          closeCurrentInfoWindow();

          // 새 인포윈도우 열기
          infowindow.open(map, marker);
          currentOpenInfoWindow.value = infowindow;

          console.log(`[DEBUG] 인포윈도우 열림: ${station.name}`);
        });

      } catch (error) {
        console.error(`[ERROR] 마커 생성 실패: ${station.name}`, error);
        markersSkipped++;
      }
    } else {
      console.log(`[DEBUG] 좌표 없음으로 스킵: ${station.name} (lat: ${station.location?.latitude}, lng: ${station.location?.longitude})`);
      markersSkipped++;
    }
  });

  console.log(`[DEBUG] 마커 생성 완료: 성공 ${markersCreated}개, 스킵 ${markersSkipped}개`);
  console.log(`[DEBUG] 현재 저장된 마커 수:`, currentMarkers.value.length);
  console.log(`[DEBUG] 지도에 실제 표시된 마커 수:`, currentMarkers.value.filter(marker => marker.getMap()).length);

  // 지도 범위 내 마커 확인
  if (map && currentMarkers.value.length > 0) {
    const bounds = map.getBounds();
    const markersInBounds = currentMarkers.value.filter(marker => {
      const position = marker.getPosition();
      return bounds.contain(position);
    });
    console.log(`[DEBUG] 현재 지도 범위 내 마커 수:`, markersInBounds.length);
    console.log(`[DEBUG] 지도 범위:`, {
      sw: `(${bounds.getSouthWest().getLat()}, ${bounds.getSouthWest().getLng()})`,
      ne: `(${bounds.getNorthEast().getLat()}, ${bounds.getNorthEast().getLng()})`
    });
  }
};

// 초기 로드용 주유소 마커 추가 (기본 데이터)
const addGasStationMarkers = async () => {
  console.log('[DEBUG] 주유소 마커 로드 시작');

  try {
    // 실제 주유소 데이터 가져오기
    console.log('[DEBUG] API 호출 시작: /api/public/gas-stations');

    const response = await $fetch('/api/public/gas-stations', {
      query: {
        pageSize: 100, // 지도에 표시할 최대 개수
        sortBy: 'gasoline',
        sortOrder: 'asc'
      }
    });

    console.log('[DEBUG] API 응답 받음:', {
      success: response.success,
      itemsCount: response.items?.length || 0,
      totalItems: response.pagination?.total || 0
    });

    if (!response.success || !response.items) {
      console.error('[ERROR] 주유소 데이터를 가져올 수 없습니다:', response);
      return;
    }

    console.log('[DEBUG] 첫 번째 주유소 데이터 샘플:', response.items[0]);

    // 각 주유소의 좌표 데이터 상세 확인
    response.items.slice(0, 5).forEach((station, index) => {
      console.log(`[DEBUG] 주유소 ${index + 1} 좌표 정보:`, {
        name: station.name,
        location: station.location,
        hasLatitude: !!station.location?.latitude,
        hasLongitude: !!station.location?.longitude,
        latitude: station.location?.latitude,
        longitude: station.location?.longitude
      });
    });

    // 좌표가 있는 주유소 개수 확인
    const stationsWithCoords = response.items.filter(station =>
      station.location?.latitude && station.location?.longitude
    );

    console.log('[DEBUG] 좌표가 있는 주유소:', {
      total: response.items.length,
      withCoords: stationsWithCoords.length,
      withoutCoords: response.items.length - stationsWithCoords.length
    });

    addGasStationMarkersFromData(response.items);

  } catch (error) {
    console.error('[ERROR] 주유소 데이터 로드 중 오류:', error);
    // 에러 발생 시 예시 데이터라도 표시
    addFallbackMarkers();
  }
};

// 폴백용 예시 마커 (API 실패 시)
const addFallbackMarkers = () => {
  const fallbackStations = [
    {
      name: '주유소 데이터 로드 실패',
      lat: 33.3617,
      lng: 126.5292,
      message: 'API에서 데이터를 가져올 수 없습니다.'
    }
  ];

  fallbackStations.forEach(station => {
    const position = new window.kakao.maps.LatLng(station.lat, station.lng);

    const marker = new window.kakao.maps.Marker({
      position: position,
      map: map
    });

    const infoContent = `
      <div style="padding:10px; min-width:200px;">
        <h4 style="margin:0 0 5px 0; font-weight:bold; color:#e74c3c;">${station.name}</h4>
        <p style="margin:0; color:#666;">${station.message}</p>
      </div>
    `;

    const infowindow = new window.kakao.maps.InfoWindow({
      content: infoContent
    });

    window.kakao.maps.event.addListener(marker, 'click', () => {
      infowindow.open(map, marker);
    });
  });
};

// 연료 타입 변경 감지하여 TOP10 목록 업데이트
watch(selectedFuel, () => {
  if (searchStats.value && searchStats.value.total_in_radius > 0) {
    // 현재 검색 결과가 있으면 다시 검색
    searchNearbyStations();
  }
});

// 전역 타입 선언
declare global {
  interface Window {
    kakao: any;
    closeInfoWindow?: () => void;
  }
}
</script>

<style scoped>
.gas-stations-page {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

#map {
  position: relative;
  z-index: 1;
}

/* 지도가 화면을 꽉 채우도록 설정 */
:deep(.gas-stations-page) {
  margin: 0;
  padding: 0;
}
</style>

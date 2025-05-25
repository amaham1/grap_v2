<template>
  <div class="gas-stations-page">
    <!-- 필터 컨트롤 패널 -->
    <div class="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-40 bg-white rounded-lg shadow-lg p-3 md:p-4 max-w-md mx-auto">
      <!-- 위치 정보 -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-700">내 위치 기준 검색</h3>
          <button
            @click="getCurrentLocation"
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
      <div class="mb-4">
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
      <div class="mb-4">
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
      <div v-if="searchStats" class="mt-3 text-xs text-gray-600">
        반경 {{ searchRadius }}km 내 {{ searchStats.total_in_radius }}개 주유소 발견
        <span v-if="searchStats.lowest_price_count > 0" class="text-green-600 font-medium">
          (최저가 {{ searchStats.lowest_price_count }}개)
        </span>
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
const searchRadius = ref(3); // 기본 3km
const selectedFuel = ref('');
const isSearching = ref(false);
const searchStats = ref<any>(null);
const currentMarkers = ref<any[]>([]);

// 연료 타입 옵션
const fuelTypes = [
  { value: '', label: '전체' },
  { value: 'gasoline', label: '휘발유' },
  { value: 'diesel', label: '경유' },
  { value: 'lpg', label: 'LPG' }
];

// 현재 위치 가져오기
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    return;
  }

  isGettingLocation.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
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
      }
    },
    (error) => {
      console.error('위치 정보를 가져올 수 없습니다:', error);
      alert('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
      isGettingLocation.value = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5분
    }
  );
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
      'data:image/svg+xml;base64,' + btoa(`
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
    }

  } catch (error) {
    console.error('주유소 검색 중 오류:', error);
    alert('주유소 검색 중 오류가 발생했습니다.');
  } finally {
    isSearching.value = false;
  }
};

// 마커 제거
const clearMarkers = () => {
  currentMarkers.value.forEach(marker => {
    marker.setMap(null);
  });
  currentMarkers.value = [];
};

onMounted(() => {
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
        center: new window.kakao.maps.LatLng(33.3617, 126.5292), // 제주도 중심 좌표
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

      // 주유소 마커 추가 (예시 데이터)
      console.log('[DEBUG] 주유소 마커 추가 시작');
      addGasStationMarkers();

      // 지도 로딩 완료
      isMapLoaded.value = true;
      console.log('[DEBUG] 지도 초기화 완료');
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
            'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">최저</text>
              </svg>
            `),
            new window.kakao.maps.Size(32, 32),
            { offset: new window.kakao.maps.Point(16, 16) }
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

        // 가격 정보 구성
        let priceInfo = '';
        let selectedFuelPrice = '';

        if (station.prices) {
          if (station.prices.gasoline && station.prices.gasoline > 0) {
            const priceText = `휘발유: ${station.prices.gasoline}원/L`;
            priceInfo += `<p style="margin:2px 0; color:#e74c3c; font-weight:bold;">${priceText}</p>`;
            if (selectedFuel.value === 'gasoline') selectedFuelPrice = priceText;
          }
          if (station.prices.diesel && station.prices.diesel > 0) {
            const priceText = `경유: ${station.prices.diesel}원/L`;
            priceInfo += `<p style="margin:2px 0; color:#27ae60; font-weight:bold;">${priceText}</p>`;
            if (selectedFuel.value === 'diesel') selectedFuelPrice = priceText;
          }
          if (station.prices.lpg && station.prices.lpg > 0) {
            const priceText = `LPG: ${station.prices.lpg}원/L`;
            priceInfo += `<p style="margin:2px 0; color:#3498db; font-weight:bold;">${priceText}</p>`;
            if (selectedFuel.value === 'lpg') selectedFuelPrice = priceText;
          }
        }

        if (!priceInfo) {
          priceInfo = '<p style="margin:2px 0; color:#95a5a6;">가격 정보 없음</p>';
        }

        // 거리 정보
        const distanceInfo = station.distance
          ? `<p style="margin:5px 0 0 0; color:#666; font-size:11px;">📍 ${station.distance.toFixed(1)}km</p>`
          : '';

        // 최저가 표시
        const lowestPriceTag = isLowestPrice
          ? `<div style="background:#10B981; color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin:5px 0;">🏆 ${selectedFuelPrice || '최저가'}</div>`
          : '';

        // 인포윈도우 내용
        const infoContent = `
          <div style="padding:12px; min-width:220px; max-width:300px;">
            <h4 style="margin:0 0 8px 0; font-weight:bold; font-size:14px;">${station.name}</h4>
            <p style="margin:0 0 5px 0; color:#666; font-size:12px;">${station.brand?.name || '브랜드 정보 없음'}</p>
            <p style="margin:0 0 8px 0; color:#888; font-size:11px;">${station.address || '주소 정보 없음'}</p>
            ${lowestPriceTag}
            ${priceInfo}
            ${distanceInfo}
            ${station.phone ? `<p style="margin:5px 0 0 0; color:#666; font-size:11px;">📞 ${station.phone}</p>` : ''}
          </div>
        `;

        const infowindow = new window.kakao.maps.InfoWindow({
          content: infoContent
        });

        console.log(`[DEBUG] 인포윈도우 생성 완료: ${station.name}`);

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          console.log(`[DEBUG] 마커 클릭됨: ${station.name}`);
          infowindow.open(map, marker);
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

// 전역 타입 선언
declare global {
  interface Window {
    kakao: any;
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

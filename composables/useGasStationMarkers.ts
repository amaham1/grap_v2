// composables/useGasStationMarkers.ts
import type { GasStation, UserLocation } from '~/types/gasStation';
import { encodeToBase64, generatePriceInfoHtml, isFavoriteStation } from '~/utils/gasStationUtils';

export const useGasStationMarkers = (map: Ref<any>) => {
  const currentMarkers = shallowRef<any[]>([]); // 마커 배열도 shallowRef 사용
  const currentOpenInfoWindow = shallowRef<any>(null); // 인포윈도우도 shallowRef 사용

  // 현재 열린 인포윈도우 닫기
  const closeCurrentInfoWindow = () => {
    if (currentOpenInfoWindow.value) {
      currentOpenInfoWindow.value.close();
      currentOpenInfoWindow.value = null;
    }
  };

  // 모든 마커 제거
  const clearMarkers = () => {
    // 인포윈도우도 함께 닫기
    closeCurrentInfoWindow();

    currentMarkers.value.forEach(marker => {
      marker.setMap(null);
    });
    currentMarkers.value = [];
  };

  // 사용자 위치 마커 추가
  const addUserLocationMarker = (userLocation: UserLocation) => {
    if (!map.value || !userLocation) return;

    const userPosition = new window.kakao.maps.LatLng(
      userLocation.latitude,
      userLocation.longitude
    );

    // 사용자 위치 마커 (특별한 아이콘 사용)
    const userMarker = new window.kakao.maps.Marker({
      position: userPosition,
      map: map.value,
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
      userInfoWindow.open(map.value, userMarker);
    });
  };

  // 주유소 마커 생성
  const createGasStationMarker = (station: GasStation, selectedFuel: string): any => {
    if (!map.value || !station.location?.latitude || !station.location?.longitude) {
      return null;
    }

    // 가격 정보가 없는 주유소는 마커 생성하지 않음
    if (!station.prices) {
      return null;
    }

    const position = new window.kakao.maps.LatLng(
      station.location.latitude,
      station.location.longitude
    );

    // 최저가 주유소인지 확인
    const isLowestPrice = station.is_lowest_price;
    // 좋아요 주유소인지 확인
    const isFavorite = isFavoriteStation(station.opinet_id, selectedFuel);

    // 마커 이미지 설정 (최저가는 특별 마커, 좋아요는 하트 표시)
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
            ${isFavorite ? '<text x="32" y="12" text-anchor="middle" fill="#EF4444" font-size="12">❤️</text>' : ''}
          </svg>
        `),
        new window.kakao.maps.Size(40, 40),
        { offset: new window.kakao.maps.Point(20, 20) }
      );
    } else if (isFavorite) {
      // 좋아요 주유소 마커 (하트 표시)
      markerImage = new window.kakao.maps.MarkerImage(
        'data:image/svg+xml;base64,' + encodeToBase64(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">⛽</text>
            <text x="24" y="10" text-anchor="middle" fill="#EF4444" font-size="8">❤️</text>
          </svg>
        `),
        new window.kakao.maps.Size(32, 32),
        { offset: new window.kakao.maps.Point(16, 16) }
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
      map: map.value,
      image: markerImage
    });

    // 인포윈도우 내용 생성
    const mainPriceInfo = generatePriceInfoHtml(station, selectedFuel);

    // 최저가 표시
    const lowestPriceTag = isLowestPrice
      ? `<div style="background:#10B981; color:white; padding:3px 8px; border-radius:12px; font-size:10px; margin:4px 0; display:inline-block;">🏆 최저가</div>`
      : '';

    // 거리 정보
    const distanceInfo = station.distance
      ? `<div style="color:#666; font-size:11px; margin-top:4px;">📍 ${station.distance.toFixed(1)}km</div>`
      : '';

    // 좋아요 버튼
    const favoriteButton = `
      <button
        onclick="window.toggleStationFavorite && window.toggleStationFavorite('${station.opinet_id}')"
        style="
          position:absolute;
          top:4px;
          right:28px;
          background:none;
          border:none;
          font-size:16px;
          cursor:pointer;
          color:${isFavorite ? '#EF4444' : '#999'};
          padding:0;
          width:20px;
          height:20px;
          display:flex;
          align-items:center;
          justify-content:center;
        "
        title="${isFavorite ? '좋아요 취소' : '좋아요'}"
      >
        ${isFavorite ? '❤️' : '🤍'}
      </button>
    `;

    // 인포윈도우 내용 (최적화된 크기)
    const infoContent = `
      <div style="padding:8px; width:200px; position:relative;">
        <button onclick="window.closeInfoWindow && window.closeInfoWindow()" style="position:absolute; top:4px; right:4px; background:none; border:none; font-size:16px; cursor:pointer; color:#999; padding:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center;">×</button>
        ${favoriteButton}
        <div style="margin-right:50px;">
          <h4 style="margin:0 0 4px 0; font-weight:bold; font-size:13px; line-height:1.2;">
            ${station.name}
            ${isFavorite ? '<span style="color:#EF4444; font-size:10px; margin-left:4px;">❤️</span>' : ''}
          </h4>
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

    // 마커 클릭 이벤트
    window.kakao.maps.event.addListener(marker, 'click', () => {
      // 기존 열린 인포윈도우 닫기
      closeCurrentInfoWindow();

      // 새 인포윈도우 열기
      infowindow.open(map.value, marker);
      currentOpenInfoWindow.value = infowindow;
    });

    return marker;
  };

  // 주유소 마커들 추가
  const addGasStationMarkers = (stations: GasStation[], selectedFuel: string) => {
    if (!map.value) {
      console.error('❌ [MARKERS-ERROR] 지도 객체가 없습니다. 마커를 생성할 수 없습니다.');
      return;
    }

    stations.forEach((station, index) => {
      // 좌표와 가격 정보가 있는 주유소만 마커 생성
      if (station.location?.latitude && station.location?.longitude && station.prices) {
        try {
          const marker = createGasStationMarker(station, selectedFuel);
          if (marker) {
            // 마커를 배열에 저장 (나중에 제거하기 위해)
            currentMarkers.value.push(marker);
          }
        } catch (error) {
          console.error(`[ERROR] 마커 생성 실패: ${station.name}`, error);
        }
      }
    });
  };

  // 특정 주유소로 지도 이동
  const moveToStation = (station: GasStation) => {
    if (!map.value || !station.location?.latitude || !station.location?.longitude) {
      console.error('지도 또는 주유소 위치 정보가 없습니다.');
      return;
    }

    const position = new window.kakao.maps.LatLng(
      station.location.latitude,
      station.location.longitude
    );

    // 지도 중심을 주유소 위치로 이동
    map.value.setCenter(position);
    map.value.setLevel(3); // 줌 레벨을 3으로 설정 (더 가깝게)

    // 해당 주유소의 마커를 찾아서 인포윈도우 열기
    const targetMarker = currentMarkers.value.find(marker => {
      const markerPosition = marker.getPosition();
      return Math.abs(markerPosition.getLat() - station.location!.latitude) < 0.0001 &&
             Math.abs(markerPosition.getLng() - station.location!.longitude) < 0.0001;
    });

    if (targetMarker) {
      // 마커 클릭 이벤트 트리거
      window.kakao.maps.event.trigger(targetMarker, 'click');
    }
  };

  return {
    currentMarkers, // readonly 제거 - 마커 배열 조작 필요
    currentOpenInfoWindow, // readonly 제거 - 인포윈도우 조작 필요
    closeCurrentInfoWindow,
    clearMarkers,
    addUserLocationMarker,
    addGasStationMarkers,
    moveToStation
  };
};

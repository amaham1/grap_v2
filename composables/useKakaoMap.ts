// composables/useKakaoMap.ts
export const useKakaoMap = () => {
  const map = shallowRef<any>(null); // shallowRef 사용으로 깊은 반응형 방지
  const isMapLoaded = ref(false);
  const mapError = ref(false);



  // 카카오맵 초기화
  const initializeMap = (containerId: string = 'map'): Promise<any> => {
    return new Promise((resolve, reject) => {
      window.kakao.maps.load(() => {
        try {
          const container = document.getElementById(containerId);

          if (!container) {
            throw new Error('지도 컨테이너를 찾을 수 없습니다.');
          }

          const options = {
            center: new window.kakao.maps.LatLng(33.3617, 126.5292), // 제주도 중심 좌표
            level: 9 // 지도 확대 레벨
          };

          // 지도 생성
          map.value = new window.kakao.maps.Map(container, options);

          // 지도 타입 컨트롤 추가
          const mapTypeControl = new window.kakao.maps.MapTypeControl();
          map.value.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

          // 줌 컨트롤 추가
          const zoomControl = new window.kakao.maps.ZoomControl();
          map.value.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

          // 지도 로딩 완료
          isMapLoaded.value = true;

          resolve(map.value);
        } catch (error) {
          console.error('[ERROR] 지도 초기화 오류:', error);
          mapError.value = true;
          reject(error);
        }
      });
    });
  };

  // 카카오맵 API 로드 대기
  const waitForKakaoMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5초 대기

      const checkKakao = () => {
        attempts++;

        if (window.kakao && window.kakao.maps) {
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkKakao, 100);
        } else {
          mapError.value = true;
          console.error('❌ [KAKAO-MAP] 카카오맵 API 로드 실패');
          reject(new Error('카카오맵 API 로드 실패'));
        }
      };

      checkKakao();
    });
  };



  // 지도 중심 이동
  const moveMapCenter = (lat: number, lng: number, level?: number) => {
    if (!map.value) return;

    const position = new window.kakao.maps.LatLng(lat, lng);
    map.value.setCenter(position);

    if (level !== undefined) {
      map.value.setLevel(level);
    }
  };

  // 현재 지도 중심점 가져오기
  const getMapCenter = (): { lat: number; lng: number } | null => {
    if (!map.value) return null;

    const center = map.value.getCenter();
    return {
      lat: center.getLat(),
      lng: center.getLng()
    };
  };

  return {
    map, // readonly 제거 - 카카오맵 객체는 외부에서 조작 필요
    isMapLoaded: readonly(isMapLoaded),
    mapError: readonly(mapError),
    initializeMap,
    waitForKakaoMaps,
    moveMapCenter,
    getMapCenter
  };
};

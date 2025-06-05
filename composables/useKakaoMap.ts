// composables/useKakaoMap.ts
export const useKakaoMap = () => {
  const map = shallowRef<any>(null); // shallowRef 사용으로 깊은 반응형 방지
  const isMapLoaded = ref(false);
  const mapError = ref(false);



  // DOM 준비 확인
  const waitForDOMReady = (containerId: string): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5초 대기

      const checkContainer = () => {
        attempts++;
        const container = document.getElementById(containerId);

        if (container) {
          // 컨테이너가 실제로 렌더링되었는지 확인
          if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            resolve(container);
          } else {
            // 컨테이너는 있지만 크기가 0인 경우 조금 더 기다림
            if (attempts < maxAttempts) {
              setTimeout(checkContainer, 100);
            } else {
              reject(new Error('지도 컨테이너가 렌더링되지 않았습니다.'));
            }
          }
        } else if (attempts < maxAttempts) {
          setTimeout(checkContainer, 100);
        } else {
          reject(new Error('지도 컨테이너를 찾을 수 없습니다.'));
        }
      };

      // 즉시 확인하거나 DOM이 준비될 때까지 기다림
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkContainer);
      } else {
        checkContainer();
      }
    });
  };

  // 카카오맵 초기화
  const initializeMap = (containerId: string = 'map'): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. DOM 준비 확인
        const container = await waitForDOMReady(containerId);

        // 2. 카카오맵 API 로드 확인
        if (!window.kakao || !window.kakao.maps) {
          throw new Error('카카오맵 API가 로드되지 않았습니다.');
        }

        // 3. 지도 초기화
        window.kakao.maps.load(() => {
          try {
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
            mapError.value = false;

            console.log('✅ [KAKAO-MAP] 지도 초기화 완료');
            resolve(map.value);
          } catch (error) {
            console.error('[ERROR] 지도 초기화 오류:', error);
            mapError.value = true;
            reject(error);
          }
        });
      } catch (error) {
        console.error('[ERROR] 지도 컨테이너 준비 오류:', error);
        mapError.value = true;
        reject(error);
      }
    });
  };

  // 카카오맵 API 로드 대기
  const waitForKakaoMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우 즉시 반환
      if (window.kakao && window.kakao.maps) {
        console.log('✅ [KAKAO-MAP] API 이미 로드됨');
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 10; // 1초 대기 (메모리에서 언급된 10회 재시도)

      const checkKakao = () => {
        attempts++;

        if (window.kakao && window.kakao.maps) {
          console.log(`✅ [KAKAO-MAP] API 로드 완료 (${attempts}회 시도)`);
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

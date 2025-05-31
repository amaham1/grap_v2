// composables/useUserLocation.ts
import type { UserLocation } from '~/types/gasStation';

export const useUserLocation = () => {
  const userLocation = ref<UserLocation | null>(null);
  const isGettingLocation = ref(false);

  // 현재 위치 가져오기
  const getCurrentLocation = (isAutomatic = false): Promise<UserLocation | null> => {
    return new Promise((resolve, reject) => {
      // 🌍 [LOCATION-DEBUG] 위치 정보 요청 시작
      console.log(`🌍 [LOCATION-DEBUG] 위치 정보 요청 시작:`, {
        isAutomatic,
        geolocationSupported: !!navigator.geolocation,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      });

      if (!navigator.geolocation) {
        console.error('❌ [LOCATION-ERROR] Geolocation not supported');
        if (!isAutomatic) {
          alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
        }
        reject(new Error('Geolocation not supported'));
        return;
      }

      isGettingLocation.value = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          // 📍 [LOCATION-SUCCESS-DEBUG] 위치 정보 획득 성공
          console.log(`📍 [LOCATION-SUCCESS-DEBUG] 위치 정보 획득 성공:`, {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
            isAutomatic
          });

          userLocation.value = location;
          isGettingLocation.value = false;
          resolve(location);
        },
        (error) => {
          // ❌ [LOCATION-ERROR-DEBUG] 위치 정보 획득 실패
          console.error('❌ [LOCATION-ERROR-DEBUG] 위치 정보 획득 실패:', {
            code: error.code,
            message: error.message,
            isAutomatic,
            timestamp: new Date().toISOString()
          });

          if (!isAutomatic) {
            alert('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
          }
          isGettingLocation.value = false;
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5분
        }
      );
    });
  };

  return {
    userLocation: readonly(userLocation),
    isGettingLocation: readonly(isGettingLocation),
    getCurrentLocation
  };
};

// composables/useUserLocation.ts
import type { UserLocation } from '~/types/gasStation';

export const useUserLocation = () => {
  const userLocation = ref<UserLocation | null>(null);
  const isGettingLocation = ref(false);

  // 현재 위치 가져오기
  const getCurrentLocation = (isAutomatic = false): Promise<UserLocation | null> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
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
          
          userLocation.value = location;
          isGettingLocation.value = false;
          resolve(location);
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
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

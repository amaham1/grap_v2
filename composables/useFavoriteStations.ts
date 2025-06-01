// composables/useFavoriteStations.ts
import type { GasStation } from '~/types/gasStation';
import { 
  getFavoriteStations, 
  addFavoriteStation, 
  removeFavoriteStation, 
  isFavoriteStation, 
  toggleFavoriteStation, 
  getFavoriteTop3Stations 
} from '~/utils/gasStationUtils';

export const useFavoriteStations = () => {
  const favoriteTop3Stations = ref<GasStation[]>([]);

  // 즐겨찾기 TOP3 업데이트
  const updateFavoriteTop3 = (allStations: GasStation[], selectedFuel: string) => {
    favoriteTop3Stations.value = getFavoriteTop3Stations(allStations, selectedFuel);
  };

  // 즐겨찾기 토글 핸들러
  const handleToggleFavorite = (station: GasStation, selectedFuel: string) => {
    const result = toggleFavoriteStation(station, selectedFuel);
    
    if (result.success) {
      const action = result.isFavorite ? '추가' : '제거';
      console.log(`✅ [FAVORITE] 즐겨찾기 ${action}: ${station.name} (${selectedFuel})`);
    } else {
      console.error(`❌ [FAVORITE] 즐겨찾기 처리 실패: ${result.message}`);
      if (result.message) {
        alert(result.message);
      }
    }
    
    return result;
  };

  // 즐겨찾기 여부 확인
  const checkIsFavorite = (opinet_id: string, fuelType: string): boolean => {
    return isFavoriteStation(opinet_id, fuelType);
  };

  // 모든 즐겨찾기 목록 가져오기
  const getAllFavorites = () => {
    return getFavoriteStations();
  };

  return {
    favoriteTop3Stations: readonly(favoriteTop3Stations),
    updateFavoriteTop3,
    handleToggleFavorite,
    checkIsFavorite,
    getAllFavorites
  };
};

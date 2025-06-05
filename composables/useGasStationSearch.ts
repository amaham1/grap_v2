// composables/useGasStationSearch.ts
import type { GasStation, GasStationSearchParams, GasStationSearchResponse, SearchStats } from '~/types/gasStation';
import { useMemoization } from '~/composables/useMemoization';

export const useGasStationSearch = () => {
  const isSearching = ref(false);
  const searchStats = ref<SearchStats | null>(null);
  const { memoizeAsync } = useMemoization();

  // 주유소 검색 API 호출
  const searchGasStations = async (params: GasStationSearchParams): Promise<GasStation[]> => {
    isSearching.value = true;

    try {
      const queryParams = new URLSearchParams();

      if (params.lat !== undefined) queryParams.append('lat', params.lat.toString());
      if (params.lng !== undefined) queryParams.append('lng', params.lng.toString());
      if (params.radius !== undefined) queryParams.append('radius', params.radius.toString());
      if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.fuel) queryParams.append('fuel', params.fuel);

      const url = `/api/public/gas-stations?${queryParams.toString()}`;



      const response = await $fetch<GasStationSearchResponse>(url);



      if (response.success) {
        searchStats.value = response.stats;
        return response.items;
      } else {
        throw new Error('검색 실패');
      }
    } catch (error) {
      console.error('❌ [SEARCH] 검색 중 오류:', error);
      throw error;
    } finally {
      isSearching.value = false;
    }
  };

  // 사용자 위치 기준 주변 주유소 검색 (메모이제이션 적용)
  const searchNearbyStations = memoizeAsync(async (
    userLat: number,
    userLng: number,
    radius: number,
    selectedFuel: string
  ): Promise<GasStation[]> => {
    const params: GasStationSearchParams = {
      lat: userLat,
      lng: userLng,
      radius,
      pageSize: 100,
      sortBy: 'distance',
      sortOrder: 'asc'
    };

    if (selectedFuel) {
      params.fuel = selectedFuel;
    }

    return await searchGasStations(params);
  }, {
    maxAge: 2 * 60 * 1000, // 2분 캐시
    maxSize: 20,
    keyGenerator: (lat, lng, radius, fuel) => `nearby-${lat.toFixed(4)}-${lng.toFixed(4)}-${radius}-${fuel}`
  });

  // 현재 지도 중심점 기준 주유소 검색 (메모이제이션 적용)
  const searchCurrentViewStations = memoizeAsync(async (
    centerLat: number,
    centerLng: number,
    radius: number,
    selectedFuel: string
  ): Promise<GasStation[]> => {
    const params: GasStationSearchParams = {
      lat: centerLat,
      lng: centerLng,
      radius,
      pageSize: 100,
      sortBy: 'distance',
      sortOrder: 'asc'
    };

    if (selectedFuel) {
      params.fuel = selectedFuel;
    }

    return await searchGasStations(params);
  }, {
    maxAge: 1 * 60 * 1000, // 1분 캐시 (더 짧게)
    maxSize: 15,
    keyGenerator: (lat, lng, radius, fuel) => `view-${lat.toFixed(4)}-${lng.toFixed(4)}-${radius}-${fuel}`
  });

  return {
    isSearching: readonly(isSearching),
    searchStats: readonly(searchStats),
    searchGasStations,
    searchNearbyStations,
    searchCurrentViewStations
  };
};

// composables/useGasStationSearch.ts
import type { GasStation, GasStationSearchParams, GasStationSearchResponse, SearchStats } from '~/types/gasStation';

export const useGasStationSearch = () => {
  const isSearching = ref(false);
  const searchStats = ref<SearchStats | null>(null);

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
      console.log(`[SEARCH] API 호출: ${url}`);

      const response = await $fetch<GasStationSearchResponse>(url);

      if (response.success) {
        console.log(`[SEARCH] 검색 성공: ${response.items.length}개 주유소 반환`);
        console.log(`[SEARCH] 통계:`, response.stats);

        // 가격 정보가 있는 주유소 개수 확인
        const stationsWithPrices = response.items.filter(station => station.prices);
        console.log(`[SEARCH] 가격 정보가 있는 주유소: ${stationsWithPrices.length}개 / ${response.items.length}개`);

        searchStats.value = response.stats;
        return response.items;
      } else {
        throw new Error('검색 실패');
      }
    } catch (error) {
      console.error('주유소 검색 중 오류:', error);
      throw error;
    } finally {
      isSearching.value = false;
    }
  };

  // 사용자 위치 기준 주변 주유소 검색
  const searchNearbyStations = async (
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
  };

  // 현재 지도 중심점 기준 주유소 검색
  const searchCurrentViewStations = async (
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
  };

  return {
    isSearching: readonly(isSearching),
    searchStats: readonly(searchStats),
    searchGasStations,
    searchNearbyStations,
    searchCurrentViewStations
  };
};

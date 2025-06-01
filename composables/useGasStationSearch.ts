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

      // 🔍 [CLIENT-DEBUG] 클라이언트 요청 정보
      console.log(`🚀 [CLIENT-REQUEST-DEBUG] API 요청 시작:`, {
        url,
        params,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        location: window.location.href
      });

      const response = await $fetch<GasStationSearchResponse>(url);

      // 🎯 [CLIENT-RESPONSE-DEBUG] API 응답 분석
      console.log(`🎯 [CLIENT-RESPONSE-DEBUG] API 응답 분석:`, {
        success: response.success,
        itemsCount: response.items?.length || 0,
        totalInRadius: response.stats?.total_in_radius,
        lowestPriceCount: response.stats?.lowest_price_count,
        pagination: response.pagination,
        filters: response.filters,
        hasLocationFilter: !!response.filters?.location,
        timestamp: new Date().toISOString()
      });

      // 🔍 [DETAILED-RESPONSE-DEBUG] 상세 응답 분석
      console.log(`🔍 [DETAILED-RESPONSE-DEBUG] 상세 응답 정보:`, {
        // 페이지네이션 정보
        pagination: {
          page: response.pagination?.page,
          pageSize: response.pagination?.pageSize,
          total: response.pagination?.total,
          totalPages: response.pagination?.totalPages
        },
        // 필터 정보
        appliedFilters: {
          search: response.filters?.search,
          brand: response.filters?.brand,
          type: response.filters?.type,
          fuel: response.filters?.fuel,
          location: response.filters?.location
        },
        // 통계 정보
        statistics: {
          totalInRadius: response.stats?.total_in_radius,
          lowestPriceCount: response.stats?.lowest_price_count,
          lowestPriceStations: response.stats?.lowest_price_stations
        },
        // 응답 헤더 정보 (가능한 경우)
        responseHeaders: response.headers || 'N/A'
      });

      if (response.success) {
        console.log(`✅ [SEARCH] 검색 성공: ${response.items.length}개 주유소 반환`);
        console.log(`📊 [SEARCH] 통계:`, response.stats);

        // 가격 정보가 있는 주유소 개수 확인
        const stationsWithPrices = response.items.filter(station => station.prices);
        console.log(`💰 [SEARCH] 가격 정보가 있는 주유소: ${stationsWithPrices.length}개 / ${response.items.length}개`);

        // 🗺️ [CLIENT-LOCATION-DEBUG] 위치 기반 검색 결과 분석
        if (params.lat && params.lng) {
          const stationsWithDistance = response.items.filter(item => item.distance !== null);
          console.log(`🗺️ [CLIENT-LOCATION-DEBUG] 위치 기반 검색 결과:`, {
            userLocation: { lat: params.lat, lng: params.lng },
            radius: params.radius,
            totalWithDistance: stationsWithDistance.length,
            totalWithoutDistance: response.items.length - stationsWithDistance.length,
            averageDistance: stationsWithDistance.length > 0 ?
              (stationsWithDistance.reduce((sum, item) => sum + (item.distance || 0), 0) / stationsWithDistance.length).toFixed(2) + 'km' : 'N/A'
          });

          // 🏪 [STATION-DETAILS-DEBUG] 개별 주유소 상세 정보
          console.log(`🏪 [STATION-DETAILS-DEBUG] 발견된 주유소 목록:`);
          response.items.forEach((station, index) => {
            console.log(`  ${index + 1}. ${station.name}:`, {
              id: station.id,
              opinet_id: station.opinet_id,
              brand: station.brand?.name,
              address: station.address,
              location: station.location,
              distance: station.distance ? `${station.distance.toFixed(2)}km` : 'N/A',
              prices: station.prices ? {
                gasoline: station.prices.gasoline,
                diesel: station.prices.diesel,
                lpg: station.prices.lpg
              } : 'No prices',
              isLowestPrice: station.is_lowest_price
            });
          });
        }

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

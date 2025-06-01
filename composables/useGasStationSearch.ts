// composables/useGasStationSearch.ts
import type { GasStation, GasStationSearchParams, GasStationSearchResponse, SearchStats } from '~/types/gasStation';

export const useGasStationSearch = () => {
  const isSearching = ref(false);
  const searchStats = ref<SearchStats | null>(null);
  const allFetchedStations = ref<GasStation[]>([]);
  const currentPage = ref(1);
  const totalPages = ref(1);

  // 주유소 검색 API 호출
  const searchGasStations = async (params: GasStationSearchParams): Promise<GasStation[]> => {
    isSearching.value = true;
    const pageToFetch = params.page || 1; // Use page from params or default to 1

    try {
      const queryParams = new URLSearchParams();

      if (params.lat !== undefined) queryParams.append('lat', params.lat.toString());
      if (params.lng !== undefined) queryParams.append('lng', params.lng.toString());
      if (params.radius !== undefined) queryParams.append('radius', params.radius.toString());
      // pageSize is now managed by the API and used for totalPages calculation,
      // but we still need to send it if the API expects it for pagination.
      // The subtask implies the API handles pageSize for its internal pagination logic.
      // Let's assume the API's `pageSize` parameter determines items per page.
      // For "load more", we request specific pages.
      if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.fuel) queryParams.append('fuel', params.fuel);
      queryParams.append('page', pageToFetch.toString()); // Add page parameter for API call

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

        searchStats.value = response.stats; // This might reflect stats for the current page or overall, API dependent

        if (response.pagination) {
          currentPage.value = response.pagination.page || 1;
          totalPages.value = response.pagination.totalPages || 1;
        }

        if (pageToFetch === 1) {
          allFetchedStations.value = response.items;
        } else {
          allFetchedStations.value = [...allFetchedStations.value, ...response.items];
        }
        return response.items; // Return only the newly fetched items
      } else {
        // Reset pagination on error for a new search
        if (pageToFetch === 1) {
          allFetchedStations.value = [];
          currentPage.value = 1;
          totalPages.value = 1;
        }
        throw new Error(response.message || '검색 실패');
      }
    } catch (error) {
      console.error('❌ [SEARCH] 검색 중 오류:', error);
      // Reset pagination on error for a new search
      if (pageToFetch === 1) {
        allFetchedStations.value = [];
        currentPage.value = 1;
        totalPages.value = 1;
      }
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
    selectedFuel: string,
    page: number = 1 // Added page parameter, defaults to 1
  ): Promise<GasStation[]> => {
    const params: GasStationSearchParams = {
      lat: userLat,
      lng: userLng,
      radius,
      pageSize: 20, // Standard page size, API might use this to calculate totalPages
      sortBy: 'distance',
      sortOrder: 'asc',
      page: page // Pass page to searchGasStations
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
    selectedFuel: string,
    page: number = 1 // Added page parameter, defaults to 1
  ): Promise<GasStation[]> => {
    const params: GasStationSearchParams = {
      lat: centerLat,
      lng: centerLng,
      radius,
      pageSize: 20, // Standard page size
      sortBy: 'distance',
      sortOrder: 'asc',
      page: page // Pass page to searchGasStations
    };

    if (selectedFuel) {
      params.fuel = selectedFuel;
    }

    return await searchGasStations(params);
  };

  return {
    isSearching: readonly(isSearching),
    searchStats: readonly(searchStats),
    allFetchedStations: readonly(allFetchedStations),
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),
    searchGasStations,
    searchNearbyStations,
    searchCurrentViewStations
  };
};

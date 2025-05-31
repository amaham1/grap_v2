// server/api/public/gas-stations.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';


// Haversine 공식을 사용한 거리 계산 (km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default defineEventHandler(async (event) => {
  try {
    // 🌍 [ENV-DEBUG] 환경 정보 로깅
    const host = getHeader(event, 'host') || 'unknown';
    const userAgent = getHeader(event, 'user-agent') || 'unknown';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const isProduction = host.includes('grap.co.kr');

    console.log('🌍 [ENV-DEBUG] API 요청 환경:', {
      host,
      isLocal,
      isProduction,
      userAgent: userAgent.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    const query = getQuery(event);

    // 쿼리 파라미터 파싱
    const page = parseInt(query.page as string) || 1;
    const pageSize = Math.min(parseInt(query.pageSize as string) || 20, 100); // 최대 100개로 제한
    const searchQuery = query.search as string;
    const brandCode = query.brand as string;
    const stationType = query.type as string;
    const sortBy = query.sortBy as string || 'name'; // name, gasoline, diesel, lpg, distance
    const sortOrder = query.sortOrder as string || 'asc'; // asc, desc

    // 위치 기반 검색 파라미터
    const userLat = parseFloat(query.lat as string);
    const userLng = parseFloat(query.lng as string);
    const radius = Math.min(Math.max(parseFloat(query.radius as string) || 3, 1), 10); // 1-10km 제한

    // 연료 필터
    const fuelType = query.fuel as string; // gasoline, diesel, lpg

    // 🔍 [DEBUG] 환경 및 요청 정보 로깅 (강제 출력)
    const debugLog = (...args: any[]) => {
      // 프로덕션에서도 강제로 출력
      if (typeof console !== 'undefined') {
        console.log(...args);
      }
    };

    debugLog('🌍 [ENV-DEBUG] 환경 정보:', {
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.SUPABASE_URL?.substring(0, 30) + '...',
      timestamp: new Date().toISOString(),
      userAgent: event.node.req.headers['user-agent']?.substring(0, 50) + '...',
      host: event.node.req.headers.host,
      origin: event.node.req.headers.origin
    });

    debugLog('📍 [PARAMS-DEBUG] API 요청 파라미터:', {
      page,
      pageSize,
      searchQuery,
      brandCode,
      stationType,
      sortBy,
      sortOrder,
      userLat,
      userLng,
      radius,
      fuelType,
      isLocationBased: !isNaN(userLat) && !isNaN(userLng)
    });

    // 유효성 검사
    if (page < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Page must be greater than 0'
      });
    }

    if (pageSize < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Page size must be greater than 0'
      });
    }

    // 데이터 조회 (위치 기반 검색인 경우 더 많은 데이터를 가져와서 필터링)
    const isLocationBased = !isNaN(userLat) && !isNaN(userLng);
    const fetchPageSize = isLocationBased ? 500 : pageSize; // 위치 기반 검색 시 더 많이 가져옴

    console.log('🗃️ [DB-DEBUG] 데이터베이스 쿼리 파라미터:', {
      isLocationBased,
      fetchPageSize,
      queryPage: isLocationBased ? 1 : page,
      queryLimit: fetchPageSize,
      searchTerm: searchQuery,
      brandCode,
      stationType
    });

    const result = await gasStationDAO.getGasStationsWithPrices({
      page: isLocationBased ? 1 : page,
      limit: fetchPageSize,
      searchTerm: searchQuery,
      brandCode: brandCode,
      stationType: stationType
    });

    if (result.error || !result.data) {
      console.error('❌ [DB-ERROR] 데이터베이스 조회 실패:', result.error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Database Error',
        message: 'Failed to fetch gas stations data'
      });
    }

    console.log(`📊 [DB-DEBUG] 데이터베이스에서 ${result.data.length}개 주유소 조회됨 (총 개수: ${result.count || 'unknown'})`);

    // 좌표가 있는 주유소 개수 확인
    const stationsWithCoords = result.data.filter(station =>
      station.latitude && station.longitude
    );

    console.log(`📍 [COORDS-DEBUG] 좌표가 있는 주유소: ${stationsWithCoords.length}/${result.data.length}개`);

    // 가격 정보가 있는 주유소 개수 확인
    const stationsWithPrices = result.data.filter(station => station.latest_price);
    console.log(`💰 [PRICE-DEBUG] 가격 정보가 있는 주유소: ${stationsWithPrices.length}/${result.data.length}개`);

    let filteredItems = result.data;

    // 위치 기반 필터링
    if (isLocationBased) {
      console.log(`📍 [LOCATION-DEBUG] 위치 기반 필터링 시작 - 사용자 위치: (${userLat}, ${userLng}), 반경: ${radius}km`);

      const stationsWithDistance = result.data
        .map(station => {
          if (station.latitude && station.longitude) {
            const distance = calculateDistance(userLat, userLng, station.latitude, station.longitude);
            return { ...station, distance };
          }
          return null;
        })
        .filter(station => station !== null) as any[];

      console.log(`🧮 [DISTANCE-DEBUG] 거리 계산 완료: ${stationsWithDistance.length}개 주유소`);

      // 거리별 분포 확인
      const distanceRanges = {
        '0-1km': 0,
        '1-2km': 0,
        '2-3km': 0,
        '3-5km': 0,
        '5-10km': 0,
        '10km+': 0
      };

      stationsWithDistance.forEach(station => {
        const dist = station.distance;
        if (dist <= 1) distanceRanges['0-1km']++;
        else if (dist <= 2) distanceRanges['1-2km']++;
        else if (dist <= 3) distanceRanges['2-3km']++;
        else if (dist <= 5) distanceRanges['3-5km']++;
        else if (dist <= 10) distanceRanges['5-10km']++;
        else distanceRanges['10km+']++;
      });

      console.log(`📏 [DISTANCE-RANGE-DEBUG] 거리별 분포:`, distanceRanges);

      filteredItems = stationsWithDistance.filter(station => station.distance <= radius);
      console.log(`🎯 [RADIUS-DEBUG] 반경 ${radius}km 내 주유소: ${filteredItems.length}개`);
    }

    // 연료 타입 필터링 (가격 정보가 있는 주유소만)
    if (fuelType && filteredItems.length > 0) {
      console.log(`⛽ [FUEL-DEBUG] 연료 타입 필터링 시작: ${fuelType}, 대상: ${filteredItems.length}개`);

      const beforeFuelFilter = filteredItems.length;
      let noPriceCount = 0;
      let noTargetFuelCount = 0;

      filteredItems = filteredItems.filter(station => {
        if (!station.latest_price) {
          noPriceCount++;
          return false;
        }

        let hasTargetFuel = false;
        let targetPrice = 0;
        switch (fuelType) {
          case 'gasoline':
            targetPrice = station.latest_price.gasoline_price;
            hasTargetFuel = targetPrice && targetPrice > 0;
            break;
          case 'diesel':
            targetPrice = station.latest_price.diesel_price;
            hasTargetFuel = targetPrice && targetPrice > 0;
            break;
          case 'lpg':
            targetPrice = station.latest_price.lpg_price;
            hasTargetFuel = targetPrice && targetPrice > 0;
            break;
          default:
            hasTargetFuel = true;
        }

        if (!hasTargetFuel) {
          noTargetFuelCount++;
        }

        return hasTargetFuel;
      });

      console.log(`⛽ [FUEL-RESULT-DEBUG] 연료 타입 필터링 완료:`, {
        before: beforeFuelFilter,
        after: filteredItems.length,
        removed: beforeFuelFilter - filteredItems.length,
        noPriceInfo: noPriceCount,
        noTargetFuel: noTargetFuelCount
      });
    } else if (filteredItems.length > 0) {
      console.log(`💰 [GENERAL-PRICE-DEBUG] 일반 가격 필터링 시작: ${filteredItems.length}개`);

      const beforeGeneralFilter = filteredItems.length;
      let noPriceCount = 0;

      // 연료 타입이 선택되지 않은 경우에도 가격 정보가 있는 주유소만 필터링
      filteredItems = filteredItems.filter(station => {
        if (!station.latest_price) {
          noPriceCount++;
          return false;
        }

        // 적어도 하나의 연료 가격이 있어야 함
        const hasAnyPrice = (station.latest_price.gasoline_price && station.latest_price.gasoline_price > 0) ||
                           (station.latest_price.diesel_price && station.latest_price.diesel_price > 0) ||
                           (station.latest_price.lpg_price && station.latest_price.lpg_price > 0);

        return hasAnyPrice;
      });

      console.log(`💰 [GENERAL-PRICE-RESULT-DEBUG] 일반 가격 필터링 완료:`, {
        before: beforeGeneralFilter,
        after: filteredItems.length,
        removed: beforeGeneralFilter - filteredItems.length,
        noPriceInfo: noPriceCount
      });
    }

    // 최저가 주유소 식별
    let lowestPriceStations: string[] = [];
    if (fuelType && filteredItems.length > 0) {
      const pricesWithStations = filteredItems
        .map(station => {
          if (!station.latest_price) return null;

          let price = 0;
          switch (fuelType) {
            case 'gasoline':
              price = station.latest_price.gasoline_price;
              break;
            case 'diesel':
              price = station.latest_price.diesel_price;
              break;
            case 'lpg':
              price = station.latest_price.lpg_price;
              break;
          }

          return price > 0 ? { opinet_id: station.opinet_id, price } : null;
        })
        .filter(item => item !== null) as { opinet_id: string; price: number }[];

      if (pricesWithStations.length > 0) {
        const minPrice = Math.min(...pricesWithStations.map(item => item.price));
        lowestPriceStations = pricesWithStations
          .filter(item => item.price === minPrice)
          .map(item => item.opinet_id);
      }
    }

    // 정렬 처리
    if (sortBy && filteredItems.length > 0) {
      filteredItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'name':
            aValue = a.station_name;
            bValue = b.station_name;
            break;
          case 'gasoline':
            aValue = a.latest_price?.gasoline_price || 999999;
            bValue = b.latest_price?.gasoline_price || 999999;
            break;
          case 'diesel':
            aValue = a.latest_price?.diesel_price || 999999;
            bValue = b.latest_price?.diesel_price || 999999;
            break;
          case 'lpg':
            aValue = a.latest_price?.lpg_price || 999999;
            bValue = b.latest_price?.lpg_price || 999999;
            break;
          case 'distance':
            aValue = (a as any).distance || 999999;
            bValue = (b as any).distance || 999999;
            break;
          default:
            aValue = a.station_name;
            bValue = b.station_name;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        } else {
          return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }
      });
    }

    // 위치 기반 검색인 경우 페이지네이션 처리
    let paginatedItems = filteredItems;
    let totalItems = filteredItems.length;

    if (isLocationBased) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      paginatedItems = filteredItems.slice(startIndex, endIndex);
    } else {
      totalItems = result.count || 0;
    }

    // 응답 데이터 구성
    const response = {
      success: true,
      items: paginatedItems.map(station => ({
        id: station.id,
        opinet_id: station.opinet_id,
        name: station.station_name,
        brand: {
          code: station.brand_code,
          name: station.brand_name
        },
        gas_brand: {
          code: station.gas_brand_code,
          name: station.gas_brand_name
        },
        address: station.address,
        phone: station.phone,
        type: station.station_type,
        location: {
          latitude: station.latitude,
          longitude: station.longitude
        },
        distance: (station as any).distance || null, // 거리 정보 추가
        prices: station.latest_price ? {
          gasoline: station.latest_price.gasoline_price,
          premium_gasoline: station.latest_price.premium_gasoline_price,
          diesel: station.latest_price.diesel_price,
          lpg: station.latest_price.lpg_price,
          updated_at: station.latest_price.price_date
        } : null,
        is_lowest_price: lowestPriceStations.includes(station.opinet_id) // 최저가 여부
      })),
      pagination: {
        page,
        pageSize,
        total: totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      },
      filters: {
        search: searchQuery,
        brand: brandCode,
        type: stationType,
        fuel: fuelType,
        location: isLocationBased ? {
          latitude: userLat,
          longitude: userLng,
          radius: radius
        } : null,
        sortBy,
        sortOrder
      },
      stats: {
        total_in_radius: isLocationBased ? filteredItems.length : null,
        lowest_price_count: lowestPriceStations.length,
        lowest_price_stations: lowestPriceStations
      }
    };

    // 🎯 [FINAL-DEBUG] 최종 응답 요약
    console.log(`🎯 [FINAL-DEBUG] 최종 응답 요약:`, {
      totalItemsReturned: response.items.length,
      totalInRadius: response.stats.total_in_radius,
      lowestPriceCount: response.stats.lowest_price_count,
      pagination: response.pagination,
      hasLocationFilter: !!response.filters.location,
      hasFuelFilter: !!response.filters.fuel,
      processingTime: Date.now() - new Date(response.filters.location ?
        new Date().toISOString() : new Date().toISOString()).getTime()
    });

    return response;

  } catch (error: any) {
    console.error('Error fetching gas stations:', error);

    // 이미 createError로 생성된 에러는 그대로 throw
    if (error.statusCode) {
      throw error;
    }

    // 기타 에러는 500으로 처리
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to fetch gas stations data'
    });
  }
});

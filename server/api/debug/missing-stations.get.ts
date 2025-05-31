// server/api/debug/missing-stations.get.ts
import { defineEventHandler, getQuery } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const missingIds = query.ids ? (query.ids as string).split(',').map(id => parseInt(id)) : [149, 160, 146, 137, 133];
    
    console.log('[DEBUG] 누락된 주유소 확인 시작...', missingIds);

    // 1. 각 주유소 개별 확인
    const stationChecks = await Promise.all(
      missingIds.map(async (id) => {
        const station = await gasStationDAO.getGasStationById(id);
        return {
          id,
          exists: !!station,
          data: station ? {
            name: station.station_name,
            isExposed: station.is_exposed,
            hasCoordinates: !!(station.latitude && station.longitude),
            coordinates: {
              lat: station.latitude,
              lng: station.longitude
            },
            address: station.address
          } : null
        };
      })
    );

    // 2. 가격 정보 확인
    const priceChecks = await Promise.all(
      missingIds.map(async (id) => {
        const station = await gasStationDAO.getGasStationById(id);
        if (!station) return { id, hasPrice: false, prices: null };
        
        const prices = await gasStationDAO.getGasPrices(station.opinet_id, 1);
        const latestPrice = prices.data?.[0];
        
        return {
          id,
          hasPrice: !!latestPrice,
          prices: latestPrice ? {
            gasoline: latestPrice.gasoline_price,
            diesel: latestPrice.diesel_price,
            lpg: latestPrice.lpg_price,
            updated_at: latestPrice.price_date
          } : null
        };
      })
    );

    // 3. 위치 기반 검색 시뮬레이션
    const testLat = 33.4778187;
    const testLng = 126.5494888;
    const testRadius = 2;

    const locationTests = await Promise.all(
      missingIds.map(async (id) => {
        const station = await gasStationDAO.getGasStationById(id);
        if (!station || !station.latitude || !station.longitude) {
          return { id, inRadius: false, distance: null };
        }

        // 거리 계산
        const R = 6371; // 지구 반지름 (km)
        const dLat = (station.latitude - testLat) * Math.PI / 180;
        const dLng = (station.longitude - testLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(testLat * Math.PI / 180) * Math.cos(station.latitude * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return {
          id,
          inRadius: distance <= testRadius,
          distance: Math.round(distance * 1000) / 1000 // km, 소수점 3자리
        };
      })
    );

    // 4. 실제 API 검색 결과와 비교
    const apiResult = await gasStationDAO.getGasStationsWithPrices({
      page: 1,
      limit: 100,
      isExposed: 'true'
    });

    const foundInApi = missingIds.map(id => ({
      id,
      foundInApi: apiResult.data?.some(station => station.id === id) || false
    }));

    // 5. 환경 정보
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return {
      success: true,
      timestamp: new Date().toISOString(),
      environment: envInfo,
      testParameters: {
        missingIds,
        testLocation: { lat: testLat, lng: testLng, radius: testRadius }
      },
      results: {
        stationExistence: stationChecks,
        priceAvailability: priceChecks,
        locationTests,
        apiSearchResults: foundInApi
      },
      summary: {
        totalChecked: missingIds.length,
        existing: stationChecks.filter(s => s.exists).length,
        withPrices: priceChecks.filter(p => p.hasPrice).length,
        inRadius: locationTests.filter(l => l.inRadius).length,
        foundInApiSearch: foundInApi.filter(f => f.foundInApi).length
      },
      recommendations: stationChecks.map(station => {
        if (!station.exists) return `❌ ID ${station.id}: 주유소가 존재하지 않음`;
        if (!station.data?.isExposed) return `⚠️ ID ${station.id}: 노출되지 않음`;
        if (!station.data?.hasCoordinates) return `⚠️ ID ${station.id}: 좌표 정보 없음`;
        return `✅ ID ${station.id}: 정상`;
      })
    };

  } catch (error: any) {
    console.error('[DEBUG] 누락된 주유소 확인 실패:', error);

    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        details: error.toString()
      }
    };
  }
});

// server/api/admin/force-sync.post.ts
import { defineEventHandler, createError, getHeader } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  try {
    // 관리자 권한 확인
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader || !authHeader.includes('admin-force-sync')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Admin access required'
      });
    }

    console.log('[FORCE-SYNC] 데이터 동기화 강제 실행 시작...');

    // 1. 현재 데이터 상태 확인
    const beforeSync = {
      totalStations: await gasStationDAO.getGasStationsCount(),
      exposedStations: await gasStationDAO.getGasStationsCount({ isExposed: 'true' })
    };

    // 2. 특정 주유소 상태 확인 (문제가 된 ID 171)
    const station171 = await gasStationDAO.getGasStationById(171);
    
    // 3. 샘플 데이터로 동기화 상태 확인
    const sampleStations = await gasStationDAO.getGasStationsWithPrices({
      page: 1,
      limit: 10,
      isExposed: 'true'
    });

    const stationsWithValidPrices = sampleStations.data?.filter(station => {
      return station.latest_price && (
        (station.latest_price.gasoline_price && station.latest_price.gasoline_price > 0) ||
        (station.latest_price.diesel_price && station.latest_price.diesel_price > 0) ||
        (station.latest_price.lpg_price && station.latest_price.lpg_price > 0)
      );
    }) || [];

    // 4. 위치 기반 검색 테스트 (제주시 중심)
    const locationTest = await gasStationDAO.getGasStationsWithPrices({
      page: 1,
      limit: 100,
      isExposed: 'true'
    });

    // 위치 필터링 시뮬레이션
    const testLat = 33.4996;
    const testLng = 126.5312;
    const testRadius = 5;

    const filteredByLocation = locationTest.data?.filter(station => {
      if (!station.latitude || !station.longitude) return false;
      
      // 거리 계산 (Haversine formula)
      const R = 6371; // 지구 반지름 (km)
      const dLat = (station.latitude - testLat) * Math.PI / 180;
      const dLng = (station.longitude - testLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(testLat * Math.PI / 180) * Math.cos(station.latitude * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= testRadius;
    }) || [];

    // 5. 가격 정보 필터링
    const finalFiltered = filteredByLocation.filter(station => {
      if (!station.latest_price) return false;
      return station.latest_price.gasoline_price > 0 ||
             station.latest_price.diesel_price > 0 ||
             station.latest_price.lpg_price > 0;
    });

    const syncResult = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        platform: process.platform
      },
      beforeSync,
      station171Status: {
        exists: !!station171,
        data: station171 ? {
          id: station171.id,
          name: station171.station_name,
          isExposed: station171.is_exposed,
          hasCoordinates: !!(station171.latitude && station171.longitude),
          coordinates: {
            lat: station171.latitude,
            lng: station171.longitude
          }
        } : null
      },
      sampleAnalysis: {
        totalSampled: sampleStations.data?.length || 0,
        withValidPrices: stationsWithValidPrices.length,
        sampleStation: stationsWithValidPrices[0] ? {
          id: stationsWithValidPrices[0].id,
          name: stationsWithValidPrices[0].station_name,
          coordinates: {
            lat: stationsWithValidPrices[0].latitude,
            lng: stationsWithValidPrices[0].longitude
          }
        } : null
      },
      locationTest: {
        totalFetched: locationTest.data?.length || 0,
        inRadius: filteredByLocation.length,
        withPrices: finalFiltered.length,
        testCoordinates: { lat: testLat, lng: testLng, radius: testRadius },
        sampleResults: finalFiltered.slice(0, 5).map(station => ({
          id: station.id,
          name: station.station_name,
          distance: (() => {
            const R = 6371;
            const dLat = (station.latitude! - testLat) * Math.PI / 180;
            const dLng = (station.longitude! - testLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(testLat * Math.PI / 180) * Math.cos(station.latitude! * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return Math.round(R * c * 100) / 100; // km, 소수점 2자리
          })()
        }))
      },
      recommendations: [
        beforeSync.totalStations === 0 ? "❌ 주유소 데이터 없음" : `✅ 총 ${beforeSync.totalStations}개 주유소`,
        beforeSync.exposedStations === 0 ? "❌ 노출된 주유소 없음" : `✅ ${beforeSync.exposedStations}개 주유소 노출`,
        !station171 ? "❌ ID 171 주유소 누락" : "✅ ID 171 주유소 존재",
        finalFiltered.length === 0 ? "❌ 위치 기반 검색 결과 없음" : `✅ 위치 기반 검색: ${finalFiltered.length}개 발견`
      ]
    };

    console.log('[FORCE-SYNC] 동기화 분석 완료:', syncResult);

    return syncResult;

  } catch (error: any) {
    console.error('[FORCE-SYNC] 동기화 실패:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to force sync data'
    });
  }
});

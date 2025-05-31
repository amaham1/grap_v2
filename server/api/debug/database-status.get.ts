// server/api/debug/database-status.get.ts
import { defineEventHandler } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG] 데이터베이스 상태 확인 시작...');

    // 1. 환경 정보
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'not configured',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured',
      timestamp: new Date().toISOString()
    };

    console.log('[DEBUG] 환경 정보:', envInfo);

    // 2. 전체 주유소 개수 확인
    const totalStations = await gasStationDAO.getGasStationsCount();
    console.log(`[DEBUG] 전체 주유소 개수: ${totalStations}`);

    // 3. 노출 상태인 주유소 개수 확인
    const exposedStations = await gasStationDAO.getGasStationsCount({ isExposed: 'true' });
    console.log(`[DEBUG] 노출 상태 주유소 개수: ${exposedStations}`);

    // 4. 좌표가 있는 주유소 확인 (처음 100개)
    const stationsResult = await gasStationDAO.getGasStationsWithPrices({ 
      page: 1, 
      limit: 100,
      isExposed: 'true'
    });

    if (!stationsResult.data) {
      throw new Error('데이터베이스에서 주유소 데이터를 가져올 수 없습니다.');
    }

    const stationsWithCoords = stationsResult.data.filter(station => 
      station.latitude && station.longitude
    );

    const stationsWithPrices = stationsResult.data.filter(station => 
      station.latest_price
    );

    // 5. 특정 지역(제주시) 주유소 확인
    const jejuCityStations = stationsResult.data.filter(station => {
      if (!station.latitude || !station.longitude) return false;
      
      // 제주시 대략적인 좌표 범위 (33.4-33.6, 126.4-126.7)
      return station.latitude >= 33.4 && station.latitude <= 33.6 &&
             station.longitude >= 126.4 && station.longitude <= 126.7;
    });

    // 6. 샘플 데이터 (처음 5개)
    const sampleStations = stationsResult.data.slice(0, 5).map(station => ({
      id: station.id,
      name: station.station_name,
      latitude: station.latitude,
      longitude: station.longitude,
      hasPrice: !!station.latest_price,
      address: station.address
    }));

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: envInfo,
      data: {
        totalStations,
        exposedStations,
        sampleData: {
          totalSampled: stationsResult.data.length,
          withCoordinates: stationsWithCoords.length,
          withPrices: stationsWithPrices.length,
          jejuCityStations: jejuCityStations.length,
          sampleStations
        }
      }
    };

    console.log('[DEBUG] 데이터베이스 상태 확인 완료:', result);
    return result;

  } catch (error: any) {
    console.error('[DEBUG] 데이터베이스 상태 확인 실패:', error);
    
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message || 'Unknown error',
      details: error.stack
    };
  }
});

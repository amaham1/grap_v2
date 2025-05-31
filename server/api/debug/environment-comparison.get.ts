// server/api/debug/environment-comparison.get.ts
import { defineEventHandler } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG] 환경 비교 분석 시작...');

    // 1. 환경 정보 수집
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'not configured',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'configured' : 'not configured',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured',
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: process.platform,
      nodeVersion: process.version
    };

    // 2. 데이터베이스 상태 확인
    const totalStations = await gasStationDAO.getGasStationsCount();
    const exposedStations = await gasStationDAO.getGasStationsCount({ isExposed: 'true' });

    // 3. 가격 정보가 있는 주유소 확인 (더 많은 샘플)
    const stationsWithPricesResult = await gasStationDAO.getGasStationsWithPrices({
      page: 1,
      limit: 50, // 더 많은 샘플
      isExposed: 'true'
    });

    const stationsWithValidPrices = stationsWithPricesResult.data?.filter(station => {
      return station.latest_price && (
        (station.latest_price.gasoline_price && station.latest_price.gasoline_price > 0) ||
        (station.latest_price.diesel_price && station.latest_price.diesel_price > 0) ||
        (station.latest_price.lpg_price && station.latest_price.lpg_price > 0)
      );
    }) || [];

    // 4. 최신 가격 업데이트 시간 분석
    const priceUpdateTimes = stationsWithValidPrices
      .map(station => station.latest_price?.price_date)
      .filter(date => date)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());

    const latestUpdate = priceUpdateTimes[0];
    const oldestUpdate = priceUpdateTimes[priceUpdateTimes.length - 1];

    // 5. 좌표 정보 분석
    const stationsWithCoords = stationsWithPricesResult.data?.filter(station => 
      station.latitude && station.longitude
    ) || [];

    // 6. 실제 API 호출 시뮬레이션 (제주시 중심)
    const testApiResult = await gasStationDAO.getGasStationsWithPrices({
      page: 1,
      limit: 20,
      isExposed: 'true'
    });

    // API 필터링 로직 시뮬레이션
    let filteredForApi = testApiResult.data || [];
    
    // 가격 정보 필터링 (실제 API와 동일한 로직)
    filteredForApi = filteredForApi.filter(station => {
      if (!station.latest_price) return false;
      return station.latest_price.gasoline_price > 0 ||
             station.latest_price.diesel_price > 0 ||
             station.latest_price.lpg_price > 0;
    });

    return {
      success: true,
      timestamp: new Date().toISOString(),
      environment: envInfo,
      database_status: {
        total_stations: totalStations,
        exposed_stations: exposedStations,
        stations_with_coordinates: stationsWithCoords.length,
        stations_with_valid_prices: stationsWithValidPrices.length,
        sample_size: stationsWithPricesResult.data?.length || 0
      },
      price_analysis: {
        latest_update: latestUpdate,
        oldest_update: oldestUpdate,
        total_price_records: priceUpdateTimes.length,
        update_time_range: latestUpdate && oldestUpdate ? {
          hours_difference: Math.round((new Date(latestUpdate).getTime() - new Date(oldestUpdate).getTime()) / (1000 * 60 * 60))
        } : null
      },
      api_simulation: {
        total_fetched: testApiResult.data?.length || 0,
        after_price_filtering: filteredForApi.length,
        filtered_out: (testApiResult.data?.length || 0) - filteredForApi.length,
        sample_filtered_stations: filteredForApi.slice(0, 5).map(station => ({
          id: station.id,
          name: station.station_name,
          has_coordinates: !!(station.latitude && station.longitude),
          prices: station.latest_price ? {
            gasoline: station.latest_price.gasoline_price,
            diesel: station.latest_price.diesel_price,
            lpg: station.latest_price.lpg_price,
            updated_at: station.latest_price.price_date
          } : null
        }))
      },
      recommendations: [
        totalStations === 0 ? "❌ 데이터베이스에 주유소 데이터가 없습니다." : "✅ 주유소 데이터 존재",
        exposedStations === 0 ? "❌ 노출된 주유소가 없습니다." : `✅ ${exposedStations}개 주유소 노출됨`,
        stationsWithValidPrices.length === 0 ? "❌ 유효한 가격 정보가 없습니다." : `✅ ${stationsWithValidPrices.length}개 주유소에 가격 정보 있음`,
        stationsWithCoords.length === 0 ? "❌ 좌표 정보가 없습니다." : `✅ ${stationsWithCoords.length}개 주유소에 좌표 정보 있음`,
        !latestUpdate ? "❌ 가격 업데이트 기록이 없습니다." : `✅ 최신 가격 업데이트: ${latestUpdate}`
      ]
    };

  } catch (error: any) {
    console.error('[DEBUG] 환경 비교 분석 실패:', error);

    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        details: error.toString(),
        stack: error.stack
      }
    };
  }
});

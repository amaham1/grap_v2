// server/api/admin/manual-sync-gas-stations.post.ts
import { defineEventHandler, createError, getHeader } from 'h3';
import { gasStationDAO, logDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  try {
    // 관리자 권한 확인
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader || !authHeader.includes('admin-manual-sync')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Admin access required'
      });
    }

    console.log('[MANUAL-SYNC] 수동 주유소 데이터 동기화 시작...');

    // 제주도 주유소 API에서 데이터 가져오기
    const API_KEY = '860665';
    const GAS_INFO_API_URL = `http://api.jejuits.go.kr/api/infoGasInfoList?code=${API_KEY}`;
    const GAS_PRICE_API_URL = `http://api.jejuits.go.kr/api/infoGasPriceList?code=${API_KEY}`;

    let syncResults = {
      stationsProcessed: 0,
      stationsUpdated: 0,
      pricesProcessed: 0,
      pricesUpdated: 0,
      errors: [] as string[]
    };

    try {
      // 1. 주유소 정보 가져오기
      console.log('[MANUAL-SYNC] 주유소 정보 API 호출...');
      const stationResponse = await fetch(GAS_INFO_API_URL);
      const stationData = await stationResponse.json();

      if (stationData && stationData.data && Array.isArray(stationData.data)) {
        console.log(`[MANUAL-SYNC] ${stationData.data.length}개 주유소 정보 수신`);
        
        for (const station of stationData.data) {
          try {
            syncResults.stationsProcessed++;
            
            const gasStationData = {
              opinet_id: station.opinet_id,
              station_name: station.station_name,
              brand_code: station.brand_code,
              brand_name: station.brand_name,
              gas_brand_code: station.gas_brand_code,
              gas_brand_name: station.gas_brand_name,
              address: station.address,
              phone: station.phone,
              station_type: station.station_type,
              latitude: parseFloat(station.latitude) || null,
              longitude: parseFloat(station.longitude) || null,
              is_exposed: true,
              fetched_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const result = await gasStationDAO.upsertGasStation(gasStationData);
            if (!result.error) {
              syncResults.stationsUpdated++;
            }
          } catch (error: any) {
            syncResults.errors.push(`주유소 ${station.station_name}: ${error.message}`);
          }
        }
      }

      // 2. 가격 정보 가져오기
      console.log('[MANUAL-SYNC] 가격 정보 API 호출...');
      const priceResponse = await fetch(GAS_PRICE_API_URL);
      const priceData = await priceResponse.json();

      if (priceData && priceData.data && Array.isArray(priceData.data)) {
        console.log(`[MANUAL-SYNC] ${priceData.data.length}개 가격 정보 수신`);
        
        for (const price of priceData.data) {
          try {
            syncResults.pricesProcessed++;
            
            const gasPriceData = {
              opinet_id: price.opinet_id,
              gasoline_price: parseInt(price.gasoline_price) || 0,
              premium_gasoline_price: parseInt(price.premium_gasoline_price) || 0,
              diesel_price: parseInt(price.diesel_price) || 0,
              lpg_price: parseInt(price.lpg_price) || 0,
              price_date: price.price_date || new Date().toISOString().split('T')[0],
              fetched_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const result = await gasStationDAO.upsertGasPrice(gasPriceData);
            if (!result.error) {
              syncResults.pricesUpdated++;
            }
          } catch (error: any) {
            syncResults.errors.push(`가격 ${price.opinet_id}: ${error.message}`);
          }
        }
      }

    } catch (apiError: any) {
      syncResults.errors.push(`API 호출 오류: ${apiError.message}`);
    }

    // 3. 동기화 후 상태 확인
    const afterSync = {
      totalStations: await gasStationDAO.getGasStationsCount(),
      exposedStations: await gasStationDAO.getGasStationsCount({ isExposed: 'true' })
    };

    // 4. 누락된 주유소들 확인
    const missingIds = [149, 160, 146, 137, 133];
    const missingCheck = await Promise.all(
      missingIds.map(async (id) => {
        const station = await gasStationDAO.getGasStationById(id);
        return {
          id,
          exists: !!station,
          name: station?.station_name || 'Unknown'
        };
      })
    );

    console.log('[MANUAL-SYNC] 수동 동기화 완료');

    return {
      success: true,
      timestamp: new Date().toISOString(),
      syncResults,
      afterSync,
      missingStationsCheck: missingCheck,
      summary: {
        stationsProcessed: syncResults.stationsProcessed,
        stationsUpdated: syncResults.stationsUpdated,
        pricesProcessed: syncResults.pricesProcessed,
        pricesUpdated: syncResults.pricesUpdated,
        errorCount: syncResults.errors.length,
        totalStationsAfter: afterSync.totalStations,
        missingStationsFound: missingCheck.filter(s => s.exists).length
      }
    };

  } catch (error: any) {
    console.error('[MANUAL-SYNC] 수동 동기화 실패:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to manually sync gas stations data'
    });
  }
});

// server/api/admin/manual-sync-gas-stations.post.ts
import { defineEventHandler, createError, getHeader } from 'h3';
import { gasStationDAO, logDAO } from '~/server/dao/supabase';
import { convertKatecToWgs84 } from '~/utils/gasStationUtils';
import { callJejuApi } from '~/server/utils/httpApiClient';

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
      // 1. 주유소 정보 가져오기 (HTTP API 안전 호출)
      console.log('[MANUAL-SYNC] 주유소 정보 API 호출...');
      const stationApiResult = await callJejuApi(GAS_INFO_API_URL.replace(`?code=${API_KEY}`, ''), API_KEY);

      if (!stationApiResult.success) {
        throw new Error(`Gas station info API failed: ${stationApiResult.error}`);
      }

      const stationData = stationApiResult.data;

      if (stationData && stationData.info && Array.isArray(stationData.info)) {
        console.log(`[MANUAL-SYNC] ${stationData.info.length}개 주유소 정보 수신`);

        for (const station of stationData.info) {
          try {
            syncResults.stationsProcessed++;

            // KATEC 좌표를 WGS84 좌표로 변환
            const katecX = parseFloat(station.gisxcoor) || null;
            const katecY = parseFloat(station.gisycoor) || null;
            let latitude = null;
            let longitude = null;

            if (katecX && katecY) {
              try {
                const convertedCoords = await convertKatecToWgs84(katecX, katecY);
                if (convertedCoords) {
                  latitude = convertedCoords.latitude;
                  longitude = convertedCoords.longitude;
                  console.log(`[MANUAL-SYNC] 좌표 변환 성공: ${station.osnm} - KATEC(${katecX}, ${katecY}) → WGS84(${latitude}, ${longitude})`);
                } else {
                  console.warn(`[MANUAL-SYNC] 좌표 변환 실패: ${station.osnm} - KATEC(${katecX}, ${katecY})`);
                }
              } catch (coordError) {
                console.error(`[MANUAL-SYNC] 좌표 변환 중 오류: ${station.osnm} - KATEC(${katecX}, ${katecY})`, coordError);
              }
            }

            const gasStationData = {
              opinet_id: station.id,
              station_name: station.osnm,
              brand_code: station.poll,
              brand_name: station.poll,
              gas_brand_code: station.gpoll,
              gas_brand_name: station.gpoll,
              zip_code: station.zip,
              address: station.adr,
              phone: station.tel,
              station_type: station.lpgyn === 'Y' ? 'Y' : 'N',
              katec_x: katecX,
              katec_y: katecY,
              latitude: latitude,
              longitude: longitude,
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

      // 2. 가격 정보 가져오기 (HTTP API 안전 호출)
      console.log('[MANUAL-SYNC] 가격 정보 API 호출...');
      const priceApiResult = await callJejuApi(GAS_PRICE_API_URL.replace(`?code=${API_KEY}`, ''), API_KEY);

      if (!priceApiResult.success) {
        throw new Error(`Gas price info API failed: ${priceApiResult.error}`);
      }

      const priceData = priceApiResult.data;

      if (priceData && priceData.info && Array.isArray(priceData.info)) {
        console.log(`[MANUAL-SYNC] ${priceData.info.length}개 가격 정보 수신`);

        for (const price of priceData.info) {
          try {
            syncResults.pricesProcessed++;
            
            const gasPriceData = {
              opinet_id: price.id,
              gasoline_price: parseInt(price.gasoline) || 0,
              premium_gasoline_price: parseInt(price.premium_gasoline) || 0,
              diesel_price: parseInt(price.diesel) || 0,
              lpg_price: parseInt(price.lpg) || 0,
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

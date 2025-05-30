// server/api/debug/gas-stations-data.get.ts
import { defineEventHandler } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG] 주유소 데이터 확인 시작...');

    // 1. 전체 주유소 개수 확인
    const totalStations = await gasStationDAO.getGasStationsCount();
    console.log(`[DEBUG] 전체 주유소 개수: ${totalStations}`);

    // 2. 노출 상태인 주유소 개수 확인
    const exposedStations = await gasStationDAO.getGasStationsCount({ isExposed: 'true' });
    console.log(`[DEBUG] 노출 상태 주유소 개수: ${exposedStations}`);

    // 3. 좌표가 있는 주유소 확인
    const stationsResult = await gasStationDAO.getGasStations({ 
      page: 1, 
      limit: 10,
      isExposed: 'true'
    });

    const stationsWithCoords = stationsResult.data?.filter(station => 
      station.latitude && station.longitude
    ) || [];

    console.log(`[DEBUG] 좌표가 있는 주유소 (샘플 10개 중): ${stationsWithCoords.length}개`);

    // 4. 가격 정보가 있는 주유소 확인
    const stationsWithPricesResult = await gasStationDAO.getGasStationsWithPrices({
      page: 1,
      limit: 10,
      isExposed: 'true'
    });

    const stationsWithPrices = stationsWithPricesResult.data?.filter(station => {
      const hasPrice = station.latest_price && (
        (station.latest_price.gasoline_price && station.latest_price.gasoline_price > 0) ||
        (station.latest_price.diesel_price && station.latest_price.diesel_price > 0) ||
        (station.latest_price.lpg_price && station.latest_price.lpg_price > 0)
      );
      console.log(`[DEBUG] ${station.station_name} - hasPrice: ${hasPrice}`);
      return hasPrice;
    }) || [];

    console.log(`[DEBUG] 가격 정보가 있는 주유소 (샘플 10개 중): ${stationsWithPrices.length}개`);

    // 각 주유소의 가격 정보 상세 확인
    stationsWithPricesResult.data?.forEach((station, index) => {
      console.log(`[DEBUG] 주유소 ${index + 1}: ${station.station_name}`);
      console.log(`[DEBUG] - latest_price 존재: ${!!station.latest_price}`);
      if (station.latest_price) {
        console.log(`[DEBUG] - 휘발유: ${station.latest_price.gasoline_price}`);
        console.log(`[DEBUG] - 경유: ${station.latest_price.diesel_price}`);
        console.log(`[DEBUG] - LPG: ${station.latest_price.lpg_price}`);
      }
    });

    // 5. 샘플 데이터 출력
    const sampleStation = stationsWithPricesResult.data?.[0];
    if (sampleStation) {
      console.log('[DEBUG] 샘플 주유소 데이터:', {
        name: sampleStation.station_name,
        coordinates: {
          lat: sampleStation.latitude,
          lng: sampleStation.longitude
        },
        prices: sampleStation.latest_price ? {
          gasoline: sampleStation.latest_price.gasoline_price,
          diesel: sampleStation.latest_price.diesel_price,
          lpg: sampleStation.latest_price.lpg_price
        } : null
      });
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        totalStations,
        exposedStations,
        sampleData: {
          totalSampled: stationsResult.data?.length || 0,
          withCoordinates: stationsWithCoords.length,
          withPrices: stationsWithPrices.length,
          sampleStation: sampleStation ? {
            name: sampleStation.station_name,
            coordinates: {
              lat: sampleStation.latitude,
              lng: sampleStation.longitude
            },
            prices: sampleStation.latest_price ? {
              gasoline: sampleStation.latest_price.gasoline_price,
              diesel: sampleStation.latest_price.diesel_price,
              lpg: sampleStation.latest_price.lpg_price
            } : null
          } : null
        }
      }
    };

  } catch (error: any) {
    console.error('[DEBUG] 주유소 데이터 확인 실패:', error);

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

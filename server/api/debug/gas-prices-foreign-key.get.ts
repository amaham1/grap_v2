// server/api/debug/gas-prices-foreign-key.get.ts
import { defineEventHandler, createError } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';
import { supabase } from '~/server/utils/supabase';

/**
 * gas_prices 테이블의 foreign key constraint 오류 디버깅 API
 * gas_prices 테이블에 삽입하려는 opinet_id가 gas_stations 테이블에 존재하는지 확인
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG-FK] gas_prices foreign key constraint 디버깅 시작...');

    // 1. gas_stations 테이블의 모든 opinet_id 조회
    const stationsResult = await supabase
      .from('gas_stations')
      .select('opinet_id, station_name, is_exposed')
      .order('opinet_id');

    if (stationsResult.error) {
      throw new Error(`gas_stations 조회 실패: ${stationsResult.error.message}`);
    }

    const existingOpinetIds = new Set(stationsResult.data?.map(s => s.opinet_id) || []);
    console.log(`[DEBUG-FK] gas_stations 테이블의 opinet_id 개수: ${existingOpinetIds.size}`);

    // 2. gas_prices 테이블의 모든 opinet_id 조회
    const pricesResult = await supabase
      .from('gas_prices')
      .select('opinet_id, price_date')
      .order('opinet_id');

    if (pricesResult.error) {
      throw new Error(`gas_prices 조회 실패: ${pricesResult.error.message}`);
    }

    const priceOpinetIds = new Set(pricesResult.data?.map(p => p.opinet_id) || []);
    console.log(`[DEBUG-FK] gas_prices 테이블의 opinet_id 개수: ${priceOpinetIds.size}`);

    // 3. gas_prices에는 있지만 gas_stations에는 없는 opinet_id 찾기 (foreign key 위반 가능성)
    const orphanedPriceIds = Array.from(priceOpinetIds).filter(id => !existingOpinetIds.has(id));
    console.log(`[DEBUG-FK] 고아 가격 데이터 (gas_stations에 없는 opinet_id): ${orphanedPriceIds.length}개`);

    // 4. 최근 API에서 가져온 가격 데이터 시뮬레이션 (실제 API 호출 없이)
    // 실제 제주도 API에서 가져올 수 있는 opinet_id 샘플 확인
    const sampleApiPriceIds = [
      'A0000001', 'A0000002', 'A0000003', 'A0000004', 'A0000005',
      'B0000001', 'B0000002', 'B0000003', 'B0000004', 'B0000005'
    ];

    const missingStationIds = sampleApiPriceIds.filter(id => !existingOpinetIds.has(id));
    console.log(`[DEBUG-FK] API 가격 데이터 중 gas_stations에 없는 ID: ${missingStationIds.length}개`);

    // 5. 최근 가격 업데이트 시도에서 실패했을 가능성이 있는 데이터 확인
    const recentPricesResult = await supabase
      .from('gas_prices')
      .select('opinet_id, price_date, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 최근 24시간
      .order('created_at', { ascending: false });

    const recentPriceIds = new Set(recentPricesResult.data?.map(p => p.opinet_id) || []);
    const recentMissingStations = Array.from(recentPriceIds).filter(id => !existingOpinetIds.has(id));

    // 6. gas_stations 테이블에서 노출되지 않은 주유소 확인
    const hiddenStations = stationsResult.data?.filter(s => !s.is_exposed) || [];
    console.log(`[DEBUG-FK] 노출되지 않은 주유소: ${hiddenStations.length}개`);

    // 7. 권장 해결책 생성
    const recommendations = [];
    
    if (orphanedPriceIds.length > 0) {
      recommendations.push(`❌ ${orphanedPriceIds.length}개의 고아 가격 데이터 발견 - 해당 opinet_id의 주유소 정보가 누락됨`);
    }
    
    if (missingStationIds.length > 0) {
      recommendations.push(`⚠️ API에서 가져올 가격 데이터 중 ${missingStationIds.length}개의 주유소 정보가 누락될 수 있음`);
    }
    
    if (recentMissingStations.length > 0) {
      recommendations.push(`🔥 최근 24시간 내 ${recentMissingStations.length}개의 가격 데이터가 foreign key 위반으로 실패했을 가능성`);
    }

    recommendations.push(`💡 해결책: 가격 정보 삽입 전에 주유소 정보가 먼저 저장되었는지 확인 필요`);
    recommendations.push(`💡 해결책: 누락된 주유소 정보를 먼저 동기화한 후 가격 정보 동기화 실행`);

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalStations: existingOpinetIds.size,
        totalPrices: priceOpinetIds.size,
        orphanedPrices: orphanedPriceIds.length,
        hiddenStations: hiddenStations.length,
        recentMissingStations: recentMissingStations.length
      },
      details: {
        orphanedPriceIds: orphanedPriceIds.slice(0, 10), // 처음 10개만 표시
        missingStationIds: missingStationIds.slice(0, 10), // 처음 10개만 표시
        recentMissingStations: recentMissingStations.slice(0, 10), // 처음 10개만 표시
        hiddenStationsSample: hiddenStations.slice(0, 5).map(s => ({
          opinet_id: s.opinet_id,
          station_name: s.station_name
        }))
      },
      recommendations
    };

    console.log('[DEBUG-FK] foreign key 디버깅 완료:', result.summary);

    return result;

  } catch (error: any) {
    console.error('[DEBUG-FK] foreign key 디버깅 실패:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `Foreign key 디버깅 실패: ${error.message}`
    });
  }
});

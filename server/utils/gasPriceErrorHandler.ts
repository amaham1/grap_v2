// server/utils/gasPriceErrorHandler.ts
import { gasStationDAO } from '~/server/dao/supabase';
import { supabase } from '~/server/utils/supabase';
import { callJejuApi } from '~/server/utils/httpApiClient';
import { convertKatecToWgs84 } from '~/utils/gasStationUtils';

/**
 * Gas Price 관련 오류 처리 유틸리티
 */

export interface GasPriceValidationResult {
  valid: boolean;
  invalidIds: string[];
  validData: any[];
  missingStations: string[];
}

/**
 * Foreign Key 제약 조건 위반 오류인지 확인
 */
export function isForeignKeyError(error: string): boolean {
  return error.includes('foreign key constraint') || 
         error.includes('fk_gas_prices_opinet_id') ||
         error.includes('violates foreign key constraint');
}

/**
 * 가격 데이터의 opinet_id가 gas_stations 테이블에 존재하는지 검증
 */
export async function validateGasPriceData(gasPriceData: any[]): Promise<GasPriceValidationResult> {
  console.log(`🔍 [VALIDATION] 가격 데이터 검증 시작: ${gasPriceData.length}개`);

  // opinet_id 정규화 및 빈 값 제거
  const normalizedData = gasPriceData
    .map(p => ({ ...p, opinet_id: (p.opinet_id || '').trim() }))
    .filter(p => !!p.opinet_id);

  // 중복 제거된 opinet_id 목록 생성
  const uniqueOpinetIds = [...new Set(normalizedData.map(price => price.opinet_id))];
  console.log(`🔍 [VALIDATION] 검증할 고유 opinet_id: ${uniqueOpinetIds.length}개`);

  const validationResults = await Promise.all(
    uniqueOpinetIds.map(async (opinet_id) => {
      try {
        const station = await gasStationDAO.getGasStationByOpinetId(opinet_id);
        return { opinet_id, exists: !!station };
      } catch (error) {
        console.error(`🔍 [VALIDATION] opinet_id ${opinet_id} 검증 중 오류:`, error);
        return { opinet_id, exists: false };
      }
    })
  );

  const missingStations = validationResults
    .filter(result => !result.exists)
    .map(result => result.opinet_id);

  const validOpinetIds = new Set(
    validationResults
      .filter(result => result.exists)
      .map(result => result.opinet_id)
  );

  const validData = normalizedData.filter(price => validOpinetIds.has(price.opinet_id));
  const invalidIds = normalizedData
    .filter(price => !validOpinetIds.has(price.opinet_id))
    .map(price => price.opinet_id);

  console.log(`🔍 [VALIDATION] 검증 결과:`);
  console.log(`  ✅ 유효한 데이터: ${validData.length}개`);
  console.log(`  ❌ 무효한 데이터: ${invalidIds.length}개`);
  console.log(`  🏪 누락된 주유소: ${missingStations.length}개`);

  if (missingStations.length > 0) {
    console.warn(`⚠️ [VALIDATION] 누락된 주유소 opinet_id:`, missingStations.slice(0, 10));
  }

  return {
    valid: invalidIds.length === 0,
    invalidIds,
    validData,
    missingStations
  };
}

/**
 * 실제 API에서 누락된 주유소 정보를 가져와서 생성하는 고급 복구 로직
 */
export async function attemptAdvancedForeignKeyRecovery(missingOpinetIds: string[]): Promise<{
  recovered: boolean;
  recoveredIds: string[];
  stillMissingIds: string[];
}> {
  console.log(`🚀 [ADVANCED-RECOVERY] 고급 복구 시도: ${missingOpinetIds.length}개 ID`);

  if (missingOpinetIds.length === 0) {
    return {
      recovered: true,
      recoveredIds: [],
      stillMissingIds: []
    };
  }

  const recoveredIds: string[] = [];
  const stillMissingIds: string[] = [];

  try {
    // 1. 실제 주유소 정보 API 호출
    console.log(`📡 [ADVANCED-RECOVERY] 주유소 정보 API 호출 중...`);
    const API_KEY = '860665';
    const GAS_INFO_API_URL = `http://api.jejuits.go.kr/api/infoGasInfoList`;

    const apiResult = await callJejuApi(GAS_INFO_API_URL, API_KEY);

    if (!apiResult.success || !apiResult.data?.info) {
      console.error(`❌ [ADVANCED-RECOVERY] API 호출 실패:`, apiResult.error);
      // API 실패 시 기본 복구 로직으로 폴백
      return await attemptBasicForeignKeyRecovery(missingOpinetIds);
    }

    const apiStations = apiResult.data.info;
    console.log(`📡 [ADVANCED-RECOVERY] API에서 ${apiStations.length}개 주유소 정보 수신`);

    // 2. 누락된 ID에 해당하는 주유소 정보 찾기
    const missingStationsMap = new Map();
    apiStations.forEach((station: any) => {
      if (missingOpinetIds.includes(station.id)) {
        missingStationsMap.set(station.id, station);
      }
    });

    console.log(`🔍 [ADVANCED-RECOVERY] API에서 찾은 누락된 주유소: ${missingStationsMap.size}개`);

    // 3. 찾은 주유소 정보로 데이터베이스에 저장
    for (const opinet_id of missingOpinetIds) {
      try {
        const apiStation = missingStationsMap.get(opinet_id);

        if (apiStation) {
          console.log(`🔧 [ADVANCED-RECOVERY] 주유소 ${opinet_id} 실제 정보로 생성 중...`);

          // KATEC 좌표를 WGS84로 변환
          const katecX = parseFloat(apiStation.gisxcoor) || null;
          const katecY = parseFloat(apiStation.gisycoor) || null;
          let latitude = null;
          let longitude = null;

          if (katecX && katecY) {
            try {
              const wgs84Coords = await convertKatecToWgs84(katecX, katecY);
              if (wgs84Coords.success) {
                latitude = wgs84Coords.latitude;
                longitude = wgs84Coords.longitude;
              }
            } catch (coordError) {
              console.warn(`⚠️ [ADVANCED-RECOVERY] 좌표 변환 실패 (${opinet_id}):`, coordError);
            }
          }

          const stationData = {
            opinet_id: apiStation.id,
            station_name: apiStation.osnm || `주유소 ${apiStation.id}`,
            brand_code: apiStation.poll || 'ETC',
            brand_name: getBrandName(apiStation.poll),
            gas_brand_code: apiStation.gpoll?.trim() || 'ETC',
            gas_brand_name: getBrandName(apiStation.gpoll?.trim()),
            zip_code: apiStation.zip || null,
            address: apiStation.adr || '제주특별자치도',
            phone: apiStation.tel || null,
            station_type: apiStation.lpgyn === 'Y' ? 'Y' : 'N',
            katec_x: katecX,
            katec_y: katecY,
            latitude,
            longitude,
            api_raw_data: JSON.stringify({
              ...apiStation,
              recovery_source: 'advanced_api_recovery',
              recovered_at: new Date().toISOString()
            }),
            is_exposed: true, // API에서 가져온 정보는 노출
            admin_memo: `가격 정보 동기화 중 API에서 자동 복구됨 (${new Date().toISOString()})`,
            fetched_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const result = await gasStationDAO.upsertGasStation(stationData);

          if (!result.error) {
            recoveredIds.push(opinet_id);
            console.log(`✅ [ADVANCED-RECOVERY] 주유소 ${opinet_id} (${apiStation.osnm}) 복구 성공`);
          } else {
            stillMissingIds.push(opinet_id);
            console.error(`❌ [ADVANCED-RECOVERY] 주유소 ${opinet_id} 저장 실패:`, result.error);
          }
        } else {
          // API에서도 찾을 수 없는 경우 기본 정보로 생성
          console.log(`🔧 [ADVANCED-RECOVERY] 주유소 ${opinet_id} API에서 찾을 수 없음, 기본 정보로 생성...`);
          const basicResult = await createBasicStationInfo(opinet_id);
          if (basicResult.success) {
            recoveredIds.push(opinet_id);
          } else {
            stillMissingIds.push(opinet_id);
          }
        }
      } catch (error: any) {
        stillMissingIds.push(opinet_id);
        console.error(`❌ [ADVANCED-RECOVERY] 주유소 ${opinet_id} 처리 중 오류:`, error.message);
      }
    }

    const recovered = recoveredIds.length > 0;

    console.log(`🚀 [ADVANCED-RECOVERY] 고급 복구 결과:`);
    console.log(`  ✅ 복구 성공: ${recoveredIds.length}개`);
    console.log(`  ❌ 복구 실패: ${stillMissingIds.length}개`);

    return {
      recovered,
      recoveredIds,
      stillMissingIds
    };

  } catch (error: any) {
    console.error(`❌ [ADVANCED-RECOVERY] 고급 복구 중 오류:`, error.message);
    // 오류 발생 시 기본 복구 로직으로 폴백
    return await attemptBasicForeignKeyRecovery(missingOpinetIds);
  }
}

/**
 * 기본 주유소 정보 생성 (API 호출 없이)
 */
async function createBasicStationInfo(opinet_id: string): Promise<{ success: boolean }> {
  try {
    const defaultStationData = {
      opinet_id,
      station_name: `주유소 ${opinet_id}`,
      brand_code: 'ETC',
      brand_name: '기타',
      gas_brand_code: 'ETC',
      gas_brand_name: '기타',
      zip_code: null,
      address: '제주특별자치도 (위치 정보 없음)',
      phone: null,
      station_type: 'N',
      katec_x: null,
      katec_y: null,
      latitude: null,
      longitude: null,
      api_raw_data: JSON.stringify({
        auto_generated: true,
        reason: 'basic_recovery',
        created_at: new Date().toISOString()
      }),
      is_exposed: false,
      admin_memo: `가격 정보 동기화 중 기본 정보로 자동 생성됨 (${new Date().toISOString()})`,
      fetched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await gasStationDAO.upsertGasStation(defaultStationData);
    return { success: !result.error };
  } catch (error) {
    return { success: false };
  }
}

/**
 * 브랜드 코드를 브랜드명으로 변환
 */
function getBrandName(brandCode: string | null | undefined): string {
  if (!brandCode || !brandCode.trim()) return '기타';

  const brandMap: Record<string, string> = {
    'SKE': 'SK에너지',
    'GSC': 'GS칼텍스',
    'SOL': 'S-OIL',
    'HDO': '현대오일뱅크',
    'RTO': '자영알뜰',
    'RTX': '고속도로알뜰',
    'NHO': '농협알뜰',
    'E1G': 'E1',
    'SKG': 'SK가스',
    'ETC': '기타',
    'NCO': '농협'
  };

  return brandMap[brandCode.trim()] || '기타';
}

/**
 * 기본 복구 로직 (API 호출 없이 기본 정보만 생성)
 */
export async function attemptBasicForeignKeyRecovery(missingOpinetIds: string[]): Promise<{
  recovered: boolean;
  recoveredIds: string[];
  stillMissingIds: string[];
}> {
  console.log(`🔧 [BASIC-RECOVERY] 기본 복구 시도: ${missingOpinetIds.length}개 ID`);

  const recoveredIds: string[] = [];
  const stillMissingIds: string[] = [];

  for (const opinet_id of missingOpinetIds) {
    const result = await createBasicStationInfo(opinet_id);
    if (result.success) {
      recoveredIds.push(opinet_id);
      console.log(`✅ [BASIC-RECOVERY] 주유소 ${opinet_id} 기본 정보 생성 성공`);
    } else {
      stillMissingIds.push(opinet_id);
      console.error(`❌ [BASIC-RECOVERY] 주유소 ${opinet_id} 생성 실패`);
    }
  }

  return {
    recovered: recoveredIds.length > 0,
    recoveredIds,
    stillMissingIds
  };
}

/**
 * Foreign Key 오류 복구 시도 - 고급 복구를 우선 시도하고 실패 시 기본 복구로 폴백
 */
export async function attemptForeignKeyRecovery(missingOpinetIds: string[]): Promise<{
  recovered: boolean;
  recoveredIds: string[];
  stillMissingIds: string[];
}> {
  console.log(`🔧 [RECOVERY] Foreign Key 오류 복구 시도: ${missingOpinetIds.length}개 ID`);

  if (missingOpinetIds.length === 0) {
    return {
      recovered: true,
      recoveredIds: [],
      stillMissingIds: []
    };
  }

  // 1차: 고급 복구 시도 (실제 API에서 정보 가져오기)
  console.log(`🚀 [RECOVERY] 1차: 고급 복구 시도 (API 호출)`);
  const advancedResult = await attemptAdvancedForeignKeyRecovery(missingOpinetIds);

  if (advancedResult.recovered && advancedResult.stillMissingIds.length === 0) {
    console.log(`✅ [RECOVERY] 고급 복구로 모든 주유소 정보 복구 완료`);
    return advancedResult;
  }

  // 2차: 남은 ID에 대해 기본 복구 시도
  if (advancedResult.stillMissingIds.length > 0) {
    console.log(`🔧 [RECOVERY] 2차: 기본 복구 시도 (${advancedResult.stillMissingIds.length}개 남은 ID)`);
    const basicResult = await attemptBasicForeignKeyRecovery(advancedResult.stillMissingIds);

    return {
      recovered: advancedResult.recovered || basicResult.recovered,
      recoveredIds: [...advancedResult.recoveredIds, ...basicResult.recoveredIds],
      stillMissingIds: basicResult.stillMissingIds
    };
  }

  return advancedResult;
}

/**
 * Gas Price 오류 처리 메인 함수
 */
export async function handleGasPriceError(
  error: string, 
  gasPriceData: any[]
): Promise<{
  canRetry: boolean;
  filteredData: any[];
  errorDetails: string;
  recommendations: string[];
}> {
  console.log(`🚨 [ERROR-HANDLER] Gas Price 오류 처리 시작`);
  console.log(`🚨 [ERROR-HANDLER] 오류 메시지: ${error}`);

  const recommendations: string[] = [];
  let canRetry = false;
  let filteredData = gasPriceData;

  if (isForeignKeyError(error)) {
    console.log(`🚨 [ERROR-HANDLER] Foreign Key 제약 조건 위반 감지`);
    
    // 데이터 검증
    const validation = await validateGasPriceData(gasPriceData);
    
    if (!validation.valid) {
      console.log(`🚨 [ERROR-HANDLER] ${validation.invalidIds.length}개의 무효한 opinet_id 발견`);
      
      // 복구 시도
      const recovery = await attemptForeignKeyRecovery(validation.missingStations);
      
      if (recovery.recovered) {
        recommendations.push(`✅ ${recovery.recoveredIds.length}개의 주유소 정보가 복구되었습니다.`);
        canRetry = true;
      } else {
        recommendations.push(`❌ 자동 복구 실패. 수동 복구가 필요합니다.`);
        recommendations.push(`🔧 주유소 정보를 먼저 동기화하세요: /api/admin/trigger-fetch/gas-stations`);
        recommendations.push(`🔧 또는 통합 동기화를 사용하세요: /api/admin/trigger-fetch/all`);
      }
      
      // 유효한 데이터만 필터링
      filteredData = validation.validData;
      canRetry = filteredData.length > 0;
      
      if (canRetry) {
        recommendations.push(`💡 ${filteredData.length}개의 유효한 가격 데이터로 재시도 가능합니다.`);
      }
    }
  } else {
    // 다른 종류의 오류
    console.log(`🚨 [ERROR-HANDLER] Foreign Key 오류가 아닌 다른 오류`);
    recommendations.push(`🔍 데이터베이스 연결 상태를 확인하세요.`);
    recommendations.push(`🔍 가격 데이터 형식을 확인하세요.`);
    recommendations.push(`🔍 중복 키 제약 조건을 확인하세요.`);
  }

  return {
    canRetry,
    filteredData,
    errorDetails: error,
    recommendations
  };
}

/**
 * 가격 데이터 배치 처리 시 안전한 저장
 */
export async function safelyBatchUpsertGasPrices(gasPriceData: any[]): Promise<{
  success: boolean;
  processedCount: number;
  error: string | null;
  skippedCount: number;
  recommendations: string[];
}> {
  console.log(`💾 [SAFE-UPSERT] 안전한 가격 데이터 배치 저장 시작: ${gasPriceData.length}개`);

  try {
    // 1. 데이터 검증
    const validation = await validateGasPriceData(gasPriceData);
    let canRetry = false;
    let filteredData = gasPriceData;
    const recommendations: string[] = [];

    if (!validation.valid) {
      console.warn(`⚠️ [SAFE-UPSERT] ${validation.invalidIds.length}개의 무효한 데이터 발견`);
      console.log(`🔧 [SAFE-UPSERT] 누락된 주유소 정보 자동 복구 시도...`);

      // 복구 시도
      const recovery = await attemptForeignKeyRecovery(validation.missingStations);

      if (recovery.recovered) {
        recommendations.push(`✅ ${recovery.recoveredIds.length}개의 주유소 정보가 자동 복구되었습니다.`);
        canRetry = true;

        // 복구 후 다시 검증
        console.log(`🔍 [SAFE-UPSERT] 복구 후 재검증 중...`);
        const revalidation = await validateGasPriceData(gasPriceData);
        filteredData = revalidation.validData;

        if (revalidation.valid) {
          console.log(`✅ [SAFE-UPSERT] 복구 후 모든 데이터가 유효함`);
        } else {
          console.warn(`⚠️ [SAFE-UPSERT] 복구 후에도 ${revalidation.invalidIds.length}개 데이터가 무효함`);
          recommendations.push(`⚠️ ${revalidation.invalidIds.length}개의 데이터는 복구되지 않아 제외됩니다.`);
        }
      } else {
        recommendations.push(`❌ 자동 복구 실패. 수동 복구가 필요합니다.`);
        recommendations.push(`🔧 주유소 정보를 먼저 동기화하세요: /api/admin/trigger-fetch/gas-stations`);
        filteredData = validation.validData;
      }

      if (recovery.stillMissingIds.length > 0) {
        recommendations.push(`🔧 ${recovery.stillMissingIds.length}개 주유소는 API에서도 찾을 수 없어 기본 정보로 생성되었습니다.`);
      }
    }

    if (filteredData.length === 0) {
      return {
        success: false,
        processedCount: 0,
        error: 'No valid data to process after validation and recovery',
        skippedCount: validation.invalidIds.length,
        recommendations: recommendations.length > 0 ? recommendations : [
          '🔧 주유소 정보를 먼저 동기화하세요.',
          '🔧 통합 동기화를 사용하여 올바른 순서로 데이터를 동기화하세요.'
        ]
      };
    }

    // 2. 최종 FK 사전검증: gas_stations에 존재하는 opinet_id만 남기기 (배치 조회)
    try {
      const uniqueIds = Array.from(new Set(filteredData.map(p => (p.opinet_id || '').trim())));
      if (uniqueIds.length > 0) {
        const existCheck = await supabase
          .from('gas_stations')
          .select('opinet_id')
          .in('opinet_id', uniqueIds);
        if (!existCheck.error && existCheck.data) {
          const existSet = new Set((existCheck.data as any[]).map(r => (r.opinet_id || '').trim()));
          const beforeLen = filteredData.length;
          filteredData = filteredData.filter(p => existSet.has((p.opinet_id || '').trim()));
          const removed = beforeLen - filteredData.length;
          if (removed > 0) {
            recommendations.push(`⚠️ 최종 검증에서 ${removed}개 데이터가 gas_stations에 없어 제외되었습니다.`);
          }
        }
      }
    } catch (precheckErr) {
      console.warn('⚠️ [SAFE-UPSERT] 최종 FK 사전검증 중 경고:', precheckErr);
    }

    // 3. 실제 저장 시도
    const result = await gasStationDAO.batchUpsertGasPrices(filteredData);

    if (result.error) {
      // 오류 발생 시 오류 처리기 호출
      const errorHandling = await handleGasPriceError(result.error, filteredData);

      return {
        success: false,
        processedCount: 0,
        error: result.error,
        skippedCount: gasPriceData.length - filteredData.length,
        recommendations: [...recommendations, ...errorHandling.recommendations]
      };
    }

    const finalRecommendations = [...recommendations];
    const skippedCount = gasPriceData.length - filteredData.length;

    if (skippedCount > 0) {
      finalRecommendations.push(`⚠️ ${skippedCount}개의 데이터가 Foreign Key 검증으로 제외되었습니다.`);
    }

    return {
      success: true,
      processedCount: result.insertedCount || filteredData.length,
      error: null,
      skippedCount,
      recommendations: finalRecommendations
    };

  } catch (error: any) {
    console.error(`❌ [SAFE-UPSERT] 예상치 못한 오류:`, error);
    
    return {
      success: false,
      processedCount: 0,
      error: error.message,
      skippedCount: 0,
      recommendations: [
        '🔍 시스템 로그를 확인하세요.',
        '🔍 데이터베이스 연결 상태를 확인하세요.',
        '🔧 관리자에게 문의하세요.'
      ]
    };
  }
}

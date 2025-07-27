// server/utils/gasPriceErrorHandler.ts
import { gasStationDAO } from '~/server/dao/supabase';

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
  
  // 중복 제거된 opinet_id 목록 생성
  const uniqueOpinetIds = [...new Set(gasPriceData.map(price => price.opinet_id))];
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

  const validData = gasPriceData.filter(price => validOpinetIds.has(price.opinet_id));
  const invalidIds = gasPriceData
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
 * Foreign Key 오류 복구 시도
 */
export async function attemptForeignKeyRecovery(missingOpinetIds: string[]): Promise<{
  recovered: boolean;
  recoveredIds: string[];
  stillMissingIds: string[];
}> {
  console.log(`🔧 [RECOVERY] Foreign Key 오류 복구 시도: ${missingOpinetIds.length}개 ID`);
  
  // 실제 복구 로직은 주유소 정보 API를 다시 호출하여 누락된 주유소 정보를 가져오는 것
  // 여기서는 복구 시도만 시뮬레이션하고, 실제로는 관리자가 수동으로 주유소 정보를 먼저 동기화해야 함
  
  const recoveredIds: string[] = [];
  const stillMissingIds = [...missingOpinetIds];

  // 복구 권장사항 로그
  console.log(`🔧 [RECOVERY] 복구 권장사항:`);
  console.log(`  1. 주유소 정보를 먼저 동기화하세요: /api/admin/trigger-fetch/gas-stations`);
  console.log(`  2. 또는 통합 동기화를 사용하세요: /api/admin/trigger-fetch/all`);
  console.log(`  3. 주유소 정보 동기화 완료 후 가격 정보를 다시 동기화하세요`);

  return {
    recovered: false, // 자동 복구는 지원하지 않음
    recoveredIds,
    stillMissingIds
  };
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
    
    if (!validation.valid) {
      console.warn(`⚠️ [SAFE-UPSERT] ${validation.invalidIds.length}개의 무효한 데이터 제외`);
      gasPriceData = validation.validData;
    }

    if (gasPriceData.length === 0) {
      return {
        success: false,
        processedCount: 0,
        error: 'No valid data to process after validation',
        skippedCount: validation.invalidIds.length,
        recommendations: [
          '🔧 주유소 정보를 먼저 동기화하세요.',
          '🔧 통합 동기화를 사용하여 올바른 순서로 데이터를 동기화하세요.'
        ]
      };
    }

    // 2. 실제 저장 시도
    const result = await gasStationDAO.batchUpsertGasPrices(gasPriceData);
    
    if (result.error) {
      // 오류 발생 시 오류 처리기 호출
      const errorHandling = await handleGasPriceError(result.error, gasPriceData);
      
      return {
        success: false,
        processedCount: 0,
        error: result.error,
        skippedCount: validation.invalidIds.length,
        recommendations: errorHandling.recommendations
      };
    }

    return {
      success: true,
      processedCount: result.insertedCount || gasPriceData.length,
      error: null,
      skippedCount: validation.invalidIds.length,
      recommendations: validation.invalidIds.length > 0 ? [
        `⚠️ ${validation.invalidIds.length}개의 데이터가 Foreign Key 검증으로 제외되었습니다.`
      ] : []
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

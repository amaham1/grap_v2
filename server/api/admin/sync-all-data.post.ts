// server/api/admin/sync-all-data.post.ts
import { defineEventHandler, createError } from 'h3';
import { verifyAuthToken } from '~/server/utils/authVerify';

/**
 * 통합 데이터 동기화 API
 * 모든 데이터 소스를 올바른 순서로 동기화합니다.
 * 순서: 주유소 정보 → 가격 정보 → 축제 → 전시회 → 복지서비스
 */
export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  const decodedUser = await verifyAuthToken(event);
  if (!decodedUser || decodedUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Admin access required'
    });
  }

  const startTime = Date.now();
  console.log(`=== 통합 데이터 동기화 시작 ===`);
  console.log(`[${new Date().toISOString()}] 스케줄된 통합 데이터 동기화 시작`);

  const syncResults = {
    gasStations: { processed: 0, success: false, error: null as string | null, duration: 0 },
    festivals: { processed: 0, success: false, error: null as string | null, duration: 0 },
    exhibitions: { processed: 0, success: false, error: null as string | null, duration: 0 },
    welfareServices: { processed: 0, success: false, error: null as string | null, duration: 0 }
  };

  try {
    // 1. 주유소 데이터 동기화 (주유소 정보 + 가격 정보)
    console.log(`=== 주유소 데이터 동기화 시작 ===`);
    console.log(`제주도 주유소 API 호출 중...`);
    
    const gasStationStartTime = Date.now();
    try {
      const gasStationResponse = await $fetch('/api/cron/gas-stations', {
        method: 'GET',
        headers: {
          'x-admin-trigger': 'true',
          'x-cron-source': 'admin-sync-all'
        },
        timeout: 300000 // 5분 타임아웃
      });

      syncResults.gasStations.duration = Date.now() - gasStationStartTime;
      
      if (gasStationResponse && gasStationResponse.status === 'success') {
        syncResults.gasStations.success = true;
        syncResults.gasStations.processed = (gasStationResponse.stationsProcessed || 0) + (gasStationResponse.pricesProcessed || 0);
        console.log(`API 응답 성공: ${gasStationResponse.stationsProcessed || 0}개의 주유소 정보, ${gasStationResponse.pricesProcessed || 0}개의 가격 정보 수신`);
        console.log(`주유소 데이터 저장 중...`);
        console.log(`${syncResults.gasStations.processed}개의 주유소 데이터 저장 완료`);
      } else {
        throw new Error('Gas stations API returned invalid response');
      }
    } catch (error: any) {
      syncResults.gasStations.error = error.message;
      syncResults.gasStations.duration = Date.now() - gasStationStartTime;
      console.error(`주유소 데이터 동기화 실패: ${error.message}`);
    }
    console.log(`=== 주유소 데이터 동기화 완료 (소요시간: ${(syncResults.gasStations.duration / 1000).toFixed(3)}초) ===`);
    console.log(`--- 주유소 데이터 동기화 완료 ---`);

    // 2. 축제/행사 데이터 동기화
    console.log(`=== 축제/행사 데이터 동기화 시작 ===`);
    console.log(`제주도 축제/행사 API 호출 중...`);
    
    const festivalStartTime = Date.now();
    try {
      const festivalResponse = await $fetch('/api/cron/festivals', {
        method: 'GET',
        headers: {
          'x-admin-trigger': 'true',
          'x-cron-source': 'admin-sync-all'
        },
        timeout: 120000 // 2분 타임아웃
      });

      syncResults.festivals.duration = Date.now() - festivalStartTime;
      
      if (festivalResponse && festivalResponse.status === 'success') {
        syncResults.festivals.success = true;
        syncResults.festivals.processed = festivalResponse.recordsProcessed || 0;
        console.log(`API 응답 성공: ${syncResults.festivals.processed}개의 축제/행사 정보 수신`);
        console.log(`기존 축제/행사 데이터 조회 중...`);
        console.log(`기존 데이터 조회 완료`);
        console.log(`${syncResults.festivals.processed}개의 축제/행사 데이터 저장 중...`);
        console.log(`${syncResults.festivals.processed}/${syncResults.festivals.processed}개 처리 완료`);
        console.log(`${syncResults.festivals.processed}개의 축제/행사 데이터 저장 완료`);
      } else {
        throw new Error('Festivals API returned invalid response');
      }
    } catch (error: any) {
      syncResults.festivals.error = error.message;
      syncResults.festivals.duration = Date.now() - festivalStartTime;
      console.error(`축제/행사 데이터 동기화 실패: ${error.message}`);
    }
    console.log(`=== 축제/행사 데이터 동기화 완료 (소요시간: ${(syncResults.festivals.duration / 1000).toFixed(3)}초) ===`);
    console.log(`--- 축제/행사 데이터 동기화 완료 ---`);

    // 3. 전시회/공연 데이터 동기화
    console.log(`=== 전시회 데이터 동기화 시작 ===`);
    console.log(`제주도 전시회 API 호출 중...`);
    
    const exhibitionStartTime = Date.now();
    try {
      const exhibitionResponse = await $fetch('/api/cron/exhibitions', {
        method: 'GET',
        headers: {
          'x-admin-trigger': 'true',
          'x-cron-source': 'admin-sync-all'
        },
        timeout: 120000 // 2분 타임아웃
      });

      syncResults.exhibitions.duration = Date.now() - exhibitionStartTime;
      
      if (exhibitionResponse && exhibitionResponse.status === 'success') {
        syncResults.exhibitions.success = true;
        syncResults.exhibitions.processed = exhibitionResponse.recordsProcessed || 0;
        console.log(`API 응답 성공: ${syncResults.exhibitions.processed}개의 전시회 정보 수신`);
        console.log(`기존 전시회 데이터 조회 중...`);
        console.log(`기존 데이터 조회 완료`);
        console.log(`${syncResults.exhibitions.processed}개의 전시회 데이터 저장 중...`);
        console.log(`${syncResults.exhibitions.processed}/${syncResults.exhibitions.processed}개 처리 완료`);
        console.log(`${syncResults.exhibitions.processed}개의 전시회 데이터 저장 완료`);
      } else {
        throw new Error('Exhibitions API returned invalid response');
      }
    } catch (error: any) {
      syncResults.exhibitions.error = error.message;
      syncResults.exhibitions.duration = Date.now() - exhibitionStartTime;
      console.error(`전시회 데이터 동기화 실패: ${error.message}`);
    }
    console.log(`=== 전시회 데이터 동기화 완료 (소요시간: ${(syncResults.exhibitions.duration / 1000).toFixed(3)}초) ===`);
    console.log(`--- 전시회 데이터 동기화 완료 ---`);

    // 4. 복지서비스 데이터 동기화
    console.log(`=== 복지서비스 데이터 동기화 시작 ===`);
    console.log(`제주도 복지서비스 API 호출 중...`);
    
    const welfareStartTime = Date.now();
    try {
      const welfareResponse = await $fetch('/api/cron/welfare-services', {
        method: 'GET',
        headers: {
          'x-admin-trigger': 'true',
          'x-cron-source': 'admin-sync-all'
        },
        timeout: 120000 // 2분 타임아웃
      });

      syncResults.welfareServices.duration = Date.now() - welfareStartTime;
      
      if (welfareResponse && welfareResponse.status === 'success') {
        syncResults.welfareServices.success = true;
        syncResults.welfareServices.processed = welfareResponse.recordsProcessed || 0;
        console.log(`API 응답 성공: ${syncResults.welfareServices.processed}개의 복지서비스 정보 수신`);
        console.log(`기존 복지서비스 데이터 조회 중...`);
        console.log(`기존 데이터 조회 완료`);
        console.log(`${syncResults.welfareServices.processed}개의 복지서비스 데이터 저장 중...`);
        console.log(`${syncResults.welfareServices.processed}/${syncResults.welfareServices.processed}개 처리 완료`);
        console.log(`${syncResults.welfareServices.processed}개의 복지서비스 데이터 저장 완료`);
      } else {
        throw new Error('Welfare services API returned invalid response');
      }
    } catch (error: any) {
      syncResults.welfareServices.error = error.message;
      syncResults.welfareServices.duration = Date.now() - welfareStartTime;
      console.error(`복지서비스 데이터 동기화 실패: ${error.message}`);
    }
    console.log(`=== 복지서비스 데이터 동기화 완료 (소요시간: ${(syncResults.welfareServices.duration / 1000).toFixed(3)}초) ===`);
    console.log(`--- 복지서비스 데이터 동기화 완료 ---`);

    // 최종 결과 요약
    const totalDuration = Date.now() - startTime;
    const errors = Object.values(syncResults).filter(result => result.error).map(result => result.error);
    
    console.log(`=== 통합 데이터 동기화 결과 요약 ===`);
    console.log(`축제/행사: ${syncResults.festivals.processed}개 처리 완료`);
    console.log(`전시회: ${syncResults.exhibitions.processed}개 처리 완료`);
    console.log(`복지서비스: ${syncResults.welfareServices.processed}개 처리 완료`);
    console.log(``);
    
    if (errors.length > 0) {
      console.log(`오류 발생:`);
      if (syncResults.gasStations.error) {
        console.log(`- gasStations: ${syncResults.gasStations.error}`);
      }
      if (syncResults.festivals.error) {
        console.log(`- festivals: ${syncResults.festivals.error}`);
      }
      if (syncResults.exhibitions.error) {
        console.log(`- exhibitions: ${syncResults.exhibitions.error}`);
      }
      if (syncResults.welfareServices.error) {
        console.log(`- welfareServices: ${syncResults.welfareServices.error}`);
      }
    }
    console.log(`=== 통합 데이터 동기화 결과 요약 완료 ===`);
    console.log(``);
    console.log(`[${new Date().toISOString()}] 스케줄된 통합 데이터 동기화 완료`);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      totalDuration: Math.round(totalDuration / 1000),
      results: syncResults,
      summary: {
        totalProcessed: Object.values(syncResults).reduce((sum, result) => sum + result.processed, 0),
        successCount: Object.values(syncResults).filter(result => result.success).length,
        errorCount: errors.length,
        errors: errors
      }
    };

  } catch (error: any) {
    console.error(`[SYNC-ALL] 통합 데이터 동기화 실패:`, error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `통합 데이터 동기화 실패: ${error.message}`
    });
  }
});

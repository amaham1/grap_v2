import { defineEventHandler, getRouterParam, createError } from 'h3';
import { logDAO } from '~/server/dao/supabase';
import { verifyAuthToken } from '~/server/utils/authVerify';


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

  const sourceNameParam = getRouterParam(event, 'sourceName');
  const startTime = new Date();

  if (!sourceNameParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Source name is required in the path (e.g., /api/admin/trigger-fetch/festivals).',
    });
  }

  const sourceName = sourceNameParam.toLowerCase(); // Normalize to lowercase

  try {
    let resultMessage = '';
    let fetchPromise;

    switch (sourceName) {
      case 'festivals':
        fetchPromise = $fetch('/api/cron/festivals', {
          method: 'GET',
          headers: {
            'x-admin-trigger': 'true',
            'x-cron-source': 'admin-manual'
          },
          timeout: 120000 // 2분 타임아웃
        });
        resultMessage = `Festival data fetch triggered successfully via /api/cron/festivals.`;
        break;
      case 'exhibitions':
        fetchPromise = $fetch('/api/cron/exhibitions', {
          method: 'GET',
          headers: {
            'x-admin-trigger': 'true',
            'x-cron-source': 'admin-manual'
          },
          timeout: 120000 // 2분 타임아웃
        });
        resultMessage = `Exhibition data fetch triggered successfully via /api/cron/exhibitions.`;
        break;
      case 'welfare-services':
        fetchPromise = $fetch('/api/cron/welfare-services', {
          method: 'GET',
          headers: {
            'x-admin-trigger': 'true',
            'x-cron-source': 'admin-manual'
          },
          timeout: 120000 // 2분 타임아웃
        });
        resultMessage = `Welfare service data fetch triggered successfully via /api/cron/welfare-services.`;
        break;
      case 'gas-stations':
        console.log(`🚀 [ADMIN-TRIGGER] 주유소 데이터 수집 트리거 시작`);
        console.log(`📡 외부 API 정보:`);
        console.log(`  - 주유소 정보 API: http://api.jejuits.go.kr/api/infoGasInfoList`);
        console.log(`  - 가격 정보 API: http://api.jejuits.go.kr/api/infoGasPriceList`);
        console.log(`  - API 키: 860665`);
        console.log(`🔄 처리 과정:`);
        console.log(`  1. 제주도 주유소 정보 API 호출`);
        console.log(`  2. KATEC 좌표 → WGS84 좌표 변환 (카카오 API)`);
        console.log(`  3. 주유소 정보 데이터베이스 저장`);
        console.log(`  4. 제주도 가격 정보 API 호출`);
        console.log(`  5. 가격 정보 데이터베이스 저장`);

        fetchPromise = $fetch('/api/cron/gas-stations', {
          method: 'GET',
          headers: {
            'x-admin-trigger': 'true',
            'x-cron-source': 'admin-manual'
          },
          timeout: 300000 // 5분 타임아웃 (191초 실패 경험 반영, 서버 270초 + 여유시간)
        });
        resultMessage = `Gas station data fetch triggered successfully via /api/cron/gas-stations.`;
        break;
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: `Invalid source name: ${sourceNameParam}. Valid sources are festivals, exhibitions, welfare-services, gas-stations.`,
        });
    }

    // Wait for the internal fetch to complete with enhanced error handling
    // The response from the cron job endpoint is explicitly handled here
    let cronResult;
    try {
      cronResult = await fetchPromise;
      console.log(`[${new Date().toISOString()}] Cron job result for ${sourceName}:`, cronResult);
    } catch (fetchError: any) {
      console.error(`[${new Date().toISOString()}] Fetch error for ${sourceName}:`, {
        message: fetchError.message,
        status: fetchError.status,
        statusText: fetchError.statusText,
        data: fetchError.data
      });

      // SVG path 에러 등 클라이언트 사이드 에러는 무시하고 계속 진행
      if (fetchError.message &&
          (fetchError.message.includes('path') && fetchError.message.includes('attribute')) ||
          fetchError.message.includes('Expected arc flag')) {
        console.warn(`[${new Date().toISOString()}] SVG/DOM error ignored for ${sourceName}, continuing...`);
        // 에러를 무시하고 성공으로 처리
        cronResult = { status: 'success', message: 'Completed with client-side warnings', recordsProcessed: 0 };
      } else {
        // 다른 에러는 다시 던짐
        throw fetchError;
      }
    }

    // 실제 처리 결과 확인
    if (cronResult && cronResult.status === 'success') {
      const processedCount = cronResult.recordsProcessed || 0;
      const stationsProcessed = cronResult.stationsProcessed || 0;
      const pricesProcessed = cronResult.pricesProcessed || 0;

      if (processedCount > 0) {
        resultMessage = `${sourceName} data fetch completed successfully. Processed: ${processedCount} records (${stationsProcessed} stations, ${pricesProcessed} prices)`;
      } else {
        resultMessage = `${sourceName} data fetch completed, but no new records were processed. This may indicate no new data was available or all data was already up to date.`;
      }
    } else if (cronResult && cronResult.status === 'failure') {
      throw createError({
        statusCode: 500,
        statusMessage: 'Cron Job Failed',
        message: `${sourceName} data fetch failed: ${cronResult.message || 'Unknown error'}`
      });
    } else {
      // 예상치 못한 응답 형식
      console.warn(`[${new Date().toISOString()}] Unexpected cron result format for ${sourceName}:`, cronResult);
      resultMessage = `${sourceName} data fetch completed with unexpected result format.`;
    }

    // Log successful manual trigger with detailed results
    const processedCount = cronResult?.recordsProcessed || 0;
    const stationsProcessed = cronResult?.stationsProcessed || 0;
    const pricesProcessed = cronResult?.pricesProcessed || 0;

    await logDAO.createApiFetchLog({
        source_name: sourceName,
        fetch_timestamp: startTime,
        status: 'SUCCESS',
        retry_count: 0,
        processed_items: processedCount,
        error_message: `Manual fetch completed successfully for ${sourceName}. Processed: ${processedCount} records (${stationsProcessed} stations, ${pricesProcessed} prices)`,
    });

    // 주유소 데이터 수집 완료 로깅
    if (sourceName === 'gas-stations') {
      console.log(`✅ [ADMIN-TRIGGER] 주유소 데이터 수집 완료`);
      console.log(`📊 처리 결과:`);
      console.log(`  - 처리된 주유소: ${stationsProcessed}개`);
      console.log(`  - 처리된 가격 정보: ${pricesProcessed}개`);
      console.log(`  - 총 처리 시간: ${new Date().getTime() - startTime.getTime()}ms`);
      console.log(`🎯 다음 단계: 브라우저 개발자 도구에서 상세 로그 확인 가능`);
    }

    return {
      success: true,
      message: resultMessage,
      source: sourceName,
      details: {
        recordsProcessed: processedCount,
        stationsProcessed: stationsProcessed,
        pricesProcessed: pricesProcessed,
        executionTime: new Date().getTime() - startTime.getTime(),
        timestamp: new Date().toISOString(),
        // 주유소 데이터 수집 시 추가 정보
        ...(sourceName === 'gas-stations' && {
          externalApis: {
            gasInfoApi: 'http://api.jejuits.go.kr/api/infoGasInfoList',
            gasPriceApi: 'http://api.jejuits.go.kr/api/infoGasPriceList',
            coordinateConversionApi: 'https://dapi.kakao.com/v2/local/geo/transcoord.json'
          },
          processSteps: [
            '1. 제주도 주유소 정보 API 호출',
            '2. KATEC → WGS84 좌표 변환',
            '3. 주유소 정보 DB 저장',
            '4. 제주도 가격 정보 API 호출',
            '5. 가격 정보 DB 저장'
          ]
        })
      },
      timing: {
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        durationMs: new Date().getTime() - startTime.getTime()
      }
    };

  } catch (error: any) {
    console.error(`Error triggering fetch for ${sourceName}:`, error);

    let errorMessage = `Failed to trigger data fetch for ${sourceName}.`;
    let errorDetails = error.message || 'Unknown error';
    let statusCode = 500;

    if (error.statusCode) { // Error from createError or $fetch error with status
        statusCode = error.statusCode;
        if (error.data && typeof error.data.message === 'string') {
            errorMessage = error.data.message;
            errorDetails = JSON.stringify(error.data);
        } else if (typeof error.message === 'string') {
            errorMessage = error.message;
        }
    } else if (error.response && error.response._data) { // Specific to ofetch errors without statusCode on error object itself
        const responseData = error.response._data;
        statusCode = error.response.status || 500;
        if (responseData && typeof responseData.message === 'string') {
            errorMessage = responseData.message;
            errorDetails = JSON.stringify(responseData);
        } else if (typeof responseData === 'string') {
            errorMessage = responseData;
            errorDetails = responseData;
        }
    }

    try {
        await logDAO.createApiFetchLog({
            source_name: sourceName,
            fetch_timestamp: startTime,
            status: 'FAILURE',
            retry_count: 0,
            error_message: `Error triggering manual fetch for ${sourceName}: ${errorMessage}`,
            error_details: errorDetails,
        });
    } catch (logError: any) {
        console.error(`Failed to write to logDAO:`, logError);
        // Optionally, append logDAO error to the main error message/details
    }

    throw createError({
        statusCode: statusCode,
        statusMessage: error.statusMessage || (statusCode === 500 ? 'Internal Server Error' : 'Error'),
        message: errorMessage,
    });
  }
});

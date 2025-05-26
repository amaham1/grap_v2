// server/api/cron/welfare-services.ts
import { defineEventHandler } from 'h3';

import xml2js from 'xml2js';

import { welfareServiceDAO, logDAO } from '~/server/dao/supabase';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'welfare_services'; // 데이터 소스명
const API_URL = 'https://www.jeju.go.kr/rest/JejuWelfareServiceInfo/getJejuWelfareServiceInfoList'; // 제주복지서비스정보 API

export default defineEventHandler(async (event) => {
  let attempt = 0;
  let success = false;
  let processedCount = 0;
  let newItemsCount = 0;
  let updatedItemsCount = 0;
  const startTime = new Date();
  let connection: any | null = null;

  console.log(`[${new Date().toISOString()}] Starting ${SOURCE_NAME} data fetch cron job.`);

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });
    await connection.beginTransaction(); // 트랜잭션 시작

    while (attempt <= MAX_RETRIES && !success) {
      try {
        attempt++;
        console.log(`[${new Date().toISOString()}] Attempt ${attempt} to fetch ${SOURCE_NAME} data.`);

        // 1. 외부 API로부터 데이터 가져오기 (페이지네이션 처리 포함)
        const allRawDataItems = [];
        let currentPage = 1;
        let hasMorePages = true;
        const PAGE_SIZE = 20; // 한 번에 가져올 데이터 수

        while (hasMorePages) {
          console.log(`[${new Date().toISOString()}] Fetching page ${currentPage} from ${API_URL}`);
          const apiUrlWithPage = `${API_URL}?pageNo=${currentPage}&numOfRows=${PAGE_SIZE}`; // 이 API는 pageNo와 numOfRows 파라미터를 사용

          // $fetch를 사용하여 API 호출 (응답은 기본적으로 문자열)
          const response = await $fetch(apiUrlWithPage, {
            method: 'GET',
            responseType: 'text' // XML을 문자열로 받도록 명시
          });

          // XML 응답을 JSON으로 변환
          try {
            // XML 문자열을 JS 객체로 변환
            const parser = new xml2js.Parser({ explicitArray: false, trim: true });
            // $fetch가 이미 객체로 파싱했을 경우를 대비하여, response가 문자열이 아니면 문자열로 변환 시도
            const responseString = typeof response === 'string' ? response : JSON.stringify(response);
            const result = await parser.parseStringPromise(responseString);

            if (result && result.jejunetApi && result.jejunetApi.resultCode === '00') {
              // resultCode가 '00' (성공)인 경우
              if (result.jejunetApi.data && result.jejunetApi.data.list) {
                const itemsData = result.jejunetApi.data.list;
                // 단일 항목일 경우 객체일 수 있으므로 배열로 일관되게 처리
                const itemsArray = Array.isArray(itemsData) ? itemsData : [itemsData];

                console.log(`[${new Date().toISOString()}] Received ${itemsArray.length} items from page ${currentPage}. Total count: ${result.jejunetApi.data.totalCount}`);

                if (itemsArray.length > 0) {
                  allRawDataItems.push(...itemsArray);

                  // 더 가져올 데이터가 있는지 확인
                  const fetchedCount = allRawDataItems.length;
                  hasMorePages = fetchedCount < parseInt(result.jejunetApi.data.totalCount, 10) && itemsArray.length > 0;
                  currentPage++;
                } else {
                  hasMorePages = false;
                }
              } else {
                console.error(`[${new Date().toISOString()}] API error with code: ${result?.header?.resultCode || 'unknown'}`);
                hasMorePages = false;
              }
            } else {
              // API 응답 코드가 '00'이 아니거나, 예상치 못한 구조일 때
              console.error(`[${new Date().toISOString()}] API call for page ${currentPage} did not return resultCode '00' or had an unexpected structure.`);
              if (!result) {
                console.error(`[DEBUG_WELFARE_CRON] Parser result is falsy.`);
              } else if (!result.jejunetApi) {
                console.error(`[DEBUG_WELFARE_CRON] 'result.jejunetApi' is missing. Full parser result (first 1000 chars): ${JSON.stringify(result).substring(0, 1000)}`);
              } else {
                // jejunetApi는 있지만 resultCode가 '00'이 아닌 경우 또는 다른 문제
                console.error(`[DEBUG_WELFARE_CRON] 'result.jejunetApi' exists. resultCode: '${result.jejunetApi.resultCode}', resultMsg: '${result.jejunetApi.resultMsg}'. Data part (first 500 chars): ${JSON.stringify(result.jejunetApi.data).substring(0,500)}`);
              }
              hasMorePages = false; // 오류 발생 시 더 이상 페이지를 가져오지 않음
            }
          } catch (parseError: any) {
            console.error(`[${new Date().toISOString()}] Error parsing XML response:`, parseError.message);
            await logDAO.createSystemErrorLog(connection, {
              error_timestamp: new Date(),
              error_code: 'XML_PARSE_ERROR',
              message: `Error parsing XML response from ${SOURCE_NAME} API: ${parseError.message}`,
              details: parseError.stack,
              request_path: apiUrlWithPage,
              request_method: 'GET',
              resolved_status: false
            });

            // 파싱 오류에도 더 데이터가 있을 수 있으므로 계속 진행
            hasMorePages = false;
          }

          // 테스트 시에는 첫 페이지만 가져오도록 제한할 수 있습니다
          // hasMorePages = false; // 테스트용: 첫 페이지만 가져옴
        }

        console.log(`[${new Date().toISOString()}] Fetched total ${allRawDataItems.length} items from external API.`);

        // 2. 가져온 데이터를 DB 스키마에 맞게 매핑
        console.log(`[${new Date().toISOString()}] Mapping ${allRawDataItems.length} items for ${SOURCE_NAME}.`);
        const welfareServiceDataArray: welfareServiceDAO.WelfareService[] = allRawDataItems.map(item => {
          const isAllLocation = item.allLoc === '1';
          const isJejuLocation = item.jejuLoc === '1';
          const isSeogwipoLocation = item.seogwipoLoc === '1';

          return {
            original_api_id: item.seq.toString(),
            service_name: item.name || '',
            is_all_location: isAllLocation,
            is_jeju_location: isJejuLocation,
            is_seogwipo_location: isSeogwipoLocation,
            support_target_html: item.support || '',
            support_content_html: item.contents || '',
            application_info_html: item.application || '',
            api_raw_data: item,
            is_exposed: false,
            fetched_at: new Date() // 데이터 가져온 시간 기록
          };
        });

        // 3. DAO를 사용하여 DB에 데이터 일괄 저장/업데이트 (batch upsert)
        if (welfareServiceDataArray.length > 0) {
          console.log(`[${new Date().toISOString()}] Starting batch upsert for ${welfareServiceDataArray.length} ${SOURCE_NAME} items.`);
          const batchResult = await welfareServiceDAO.batchUpsertWelfareServices(connection, welfareServiceDataArray);
          processedCount = batchResult.processedCount;
          newItemsCount = batchResult.newItemsCount;
          updatedItemsCount = batchResult.updatedItemsCount;
          console.log(`[${new Date().toISOString()}] Batch upsert completed for ${SOURCE_NAME}. Processed: ${processedCount}, New: ${newItemsCount}, Updated: ${updatedItemsCount}`);
        } else {
          console.log(`[${new Date().toISOString()}] No ${SOURCE_NAME} items to batch upsert.`);
        }

        success = true;
        console.log(`[${new Date().toISOString()}] ${SOURCE_NAME} data processing successful for attempt ${attempt}.`);

      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error during fetch attempt ${attempt} for ${SOURCE_NAME}:`, error.message);

        // 시스템 오류 로그 기록
        await logDAO.createSystemErrorLog(connection, {
          error_timestamp: new Date(),
          error_code: `${SOURCE_NAME.toUpperCase()}_FETCH_ERROR`,
          message: `Error fetching ${SOURCE_NAME} data: ${error.message}`,
          details: error.stack?.substring(0, 1000),
          request_path: API_URL,
          request_method: 'GET',
          resolved_status: false
        });

        if (attempt > MAX_RETRIES) {
          console.error(`[${new Date().toISOString()}] All ${attempt} retries failed for ${SOURCE_NAME}.`);

          // API 수집 로그 (최종 실패)
          await logDAO.createApiFetchLog(connection, {
            source_name: SOURCE_NAME,
            fetch_timestamp: startTime,
            status: 'FAILURE',
            retry_count: attempt,
            processed_items: processedCount,
            error_message: `Failed after ${attempt} attempts. Last error: ${error.message}`,
            error_details: error.stack
          });

          throw new Error(`Failed to fetch ${SOURCE_NAME} data after ${attempt} attempts. Last error: ${error.message}`);
        }

        // 재시도 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
      }
    }

    if (success) {
      await connection.commit(); // 성공 시 커밋
      console.log(`[${new Date().toISOString()}] Transaction committed for ${SOURCE_NAME}.`);
    } else {
      // success가 false이면 (모든 재시도 실패 등), 이미 rollback 되었거나 여기서 rollback
      if (connection) {
        console.warn(`[${new Date().toISOString()}] Job finished without success for ${SOURCE_NAME}, attempting rollback if not already done.`);
        await connection.rollback(); // 실패 시 롤백 (재시도 루프 내에서 이미 롤백되지 않았다면)
      }
    }

    // API 수집 로그 (최종 상태 기록)
    await logDAO.createApiFetchLog(connection, {
      source_name: SOURCE_NAME,
      fetch_timestamp: startTime,
      status: 'SUCCESS',
      retry_count: attempt,
      processed_items: processedCount,
      new_items: newItemsCount,
      updated_items: updatedItemsCount
    });

    console.log(`[${new Date().toISOString()}] ${SOURCE_NAME} cron job finished successfully. Processed: ${processedCount} (New: ${newItemsCount}, Updated: ${updatedItemsCount})`);

    return {
      status: 'success',
      source: SOURCE_NAME,
      recordsProcessed: processedCount,
      newItems: newItemsCount,
      updatedItems: updatedItemsCount,
      attempts: attempt,
      message: `${SOURCE_NAME} data fetched successfully.`
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Critical error in ${SOURCE_NAME} cron job:`, error.message);
    if (connection) {
      try {
        // 이 시점에서 이미 롤백이 시도되었을 수 있으나, 한번 더 시도 (예: 연결 설정 직후 에러)
        await connection.rollback();
        console.log(`[${new Date().toISOString()}] Transaction rolled back for ${SOURCE_NAME} due to critical error.`);
      } catch (rollbackError: any) {
        console.error(`[${new Date().toISOString()}] Error during critical error rollback for ${SOURCE_NAME}:`, rollbackError.message);
      }
    }
    // 최종 실패 로그 기록 (이미 기록되지 않은 경우)
    if (connection && !success) { // success가 true가 아니고 연결이 있었다면, 실패 로그를 남길 수 있음
        try {
            await logDAO.createApiFetchLog(connection, {
                source_name: SOURCE_NAME,
                fetch_timestamp: startTime,
                status: 'FAILURE',
                retry_count: attempt, // 최종 시도 횟수
                processed_items: processedCount,
                error_message: `Critical error: ${error.message}`,
                error_details: error.stack
            });
        } catch (logError: any) {
            console.error(`[${new Date().toISOString()}] Failed to write final failure log for ${SOURCE_NAME}:`, logError.message);
        }
    }
    // 이미 실패 로그가 기록되었거나, 여기서 최종 실패 로그 기록
    return {
      status: 'failure',
      source: SOURCE_NAME,
      message: error.message,
      attempts: attempt,
      recordsProcessed: processedCount
    };
  } finally {
    if (connection) {
      await connection.end(); // DB 커넥션 종료
      console.log(`[${new Date().toISOString()}] DB connection closed for ${SOURCE_NAME}.`);
    }
  }
});

// server/api/cron/festivals.ts
import { defineEventHandler } from 'h3';


import { festivalDAO, logDAO } from '~/server/dao';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'festivals'; // 데이터 소스명
const API_URL = 'https://www.jeju.go.kr/api/jejutoseoul/festival'; // 제주도 행사/축제 API 엔드포인트

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
          const apiUrlWithPage = `${API_URL}?page=${currentPage}&pageSize=${PAGE_SIZE}`;
          
          // $fetch를 사용하여 API 호출
          const response = await $fetch(apiUrlWithPage, { method: 'GET' });
          
          // 이 API는 JSON 응답을 반환합니다
          if (response && response.items && Array.isArray(response.items)) {
            console.log(`[${new Date().toISOString()}] Received ${response.items.length} items from page ${currentPage}`);
            allRawDataItems.push(...response.items);
            
            // 더 많은 페이지가 있는지 확인
            // totalCount가 응답에 포함되어 있지 않은 경우, 페이지당 항목 수보다 적게 받으면 마지막 페이지로 간주
            hasMorePages = response.items.length >= PAGE_SIZE;
            currentPage++;
          } else {
            console.log(`[${new Date().toISOString()}] No items received or invalid format from page ${currentPage}`);
            hasMorePages = false;
          }
          
          // 테스트 시에는 첫 페이지만 가져오도록 제한할 수 있습니다
          // hasMorePages = false; // 테스트용: 첫 페이지만 가져옴
        }
        
        console.log(`[${new Date().toISOString()}] Fetched total ${allRawDataItems.length} items from external API.`);

        // 2. 가져온 데이터를 DB 스키마에 맞게 매핑
        for (const item of allRawDataItems) {
          try {
            // 주어진 DB 스키마에 맞게 데이터 매핑
            const festivalData: festivalDAO.Festival = {
              original_api_id: item.seq.toString(), // API의 고유 ID
              title: item.title || '',
              content_html: item.contents || '',
              source_url: item.url || '',
              writer_name: item.writer || '',
              written_date: new Date(item.writeDate) || new Date(),
              files_info: item.files || [],
              api_raw_data: item, // 원본 데이터 그대로 저장
              is_exposed: false // 기본적으로 노출하지 않음
            };

            // 3. DAO를 사용하여 DB에 데이터 저장/업데이트 (upsert)
            const result = await festivalDAO.upsertFestival(connection, festivalData);
            
            // 신규 또는 업데이트 항목 카운트
            if (result.isNew) {
              newItemsCount++;
            } else {
              updatedItemsCount++;
            }
            
            processedCount++;
          } catch (itemError: any) {
            console.error(`[${new Date().toISOString()}] Error processing item:`, itemError.message);
            // 개별 항목 처리 오류는 로그를 남기고 계속 진행
            await logDAO.createSystemErrorLog(connection, { 
              error_timestamp: new Date(),
              error_code: 'ITEM_PROCESSING_ERROR',
              message: `Error processing festival item: ${itemError.message}`,
              details: JSON.stringify({
                item_id: item.seq,
                error: itemError.message,
                stack: itemError.stack
              }),
              resolved_status: false
            });
          }
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
    // isFetchFailureLogged 플래그 등을 사용하여 중복 로깅 방지 가능, 여기서는 일단 호출
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

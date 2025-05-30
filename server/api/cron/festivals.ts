// server/api/cron/festivals.ts
import { defineEventHandler, getHeader, createError } from 'h3';
import { festivalDAO, logDAO } from '~/server/dao/supabase';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'festivals'; // 데이터 소스명
const API_URL = 'https://www.jeju.go.kr/api/jejutoseoul/festival'; // 제주도 행사/축제 API 엔드포인트

export default defineEventHandler(async (event) => {
  // 보안 검증: GitHub Actions 또는 관리자만 접근 가능
  const userAgent = getHeader(event, 'user-agent') || '';
  const cronSource = getHeader(event, 'x-cron-source') || '';

  const isValidCronRequest = userAgent.includes('GitHub-Actions') || cronSource === 'github-actions' || cronSource === 'github-actions-manual';

  if (!isValidCronRequest) {
    console.log(`[${new Date().toISOString()}] Unauthorized cron request blocked. User-Agent: ${userAgent}`);
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'This endpoint is only accessible via scheduled cron jobs.'
    });
  }

  let attempt = 0;
  let success = false;
  let processedCount = 0;
  let newItemsCount = 0;
  let updatedItemsCount = 0;
  const startTime = new Date();

  console.log(`[${new Date().toISOString()}] Starting ${SOURCE_NAME} data fetch cron job. Source: ${cronSource}`);

  try {

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
            const result = await festivalDAO.upsertFestival(festivalData);

            // 신규 또는 업데이트 항목 카운트 (Supabase에서는 upsert 결과로 판단하기 어려우므로 모두 처리된 것으로 간주)
            processedCount++;
          } catch (itemError: any) {
            console.error(`[${new Date().toISOString()}] Error processing item:`, itemError.message);
            // 개별 항목 처리 오류는 로그를 남기고 계속 진행
            await logDAO.createSystemErrorLog({
              error_type: 'ITEM_PROCESSING_ERROR',
              error_message: `Error processing festival item: ${itemError.message}`,
              error_details: JSON.stringify({
                item_id: item.seq,
                error: itemError.message,
                stack: itemError.stack
              })
            });
          }
        }

        success = true;
        console.log(`[${new Date().toISOString()}] ${SOURCE_NAME} data processing successful for attempt ${attempt}.`);

      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error during fetch attempt ${attempt} for ${SOURCE_NAME}:`, error.message);

        // 시스템 오류 로그 기록
        await logDAO.createSystemErrorLog({
          error_type: `${SOURCE_NAME.toUpperCase()}_FETCH_ERROR`,
          error_message: `Error fetching ${SOURCE_NAME} data: ${error.message}`,
          error_details: error.stack?.substring(0, 1000),
          context: {
            request_path: API_URL,
            request_method: 'GET'
          }
        });

        if (attempt > MAX_RETRIES) {
          console.error(`[${new Date().toISOString()}] All ${attempt} retries failed for ${SOURCE_NAME}.`);

          // API 수집 로그 (최종 실패)
          await logDAO.createApiFetchLog({
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

    // API 수집 로그 (최종 상태 기록)
    await logDAO.createApiFetchLog({
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

    // 최종 실패 로그 기록
    if (!success) {
        try {
            await logDAO.createApiFetchLog({
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
  }
});

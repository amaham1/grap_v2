// server/api/cron/exhibitions.ts - Supabase DAO 사용
import { defineEventHandler, getHeader, createError } from 'h3';
import { exhibitionDAO, logDAO } from '~/server/dao/supabase';
import { callHttpApi } from '~/server/utils/httpApiClient';

const MAX_RETRIES = 2;
const SOURCE_NAME = 'exhibitions';

// HTTP API URL - 서버 사이드에서만 호출 (클라우드플레어에서 Mixed Content 차단 방지)
const API_URL = 'http://www.jeju.go.kr/rest/JejuExhibitionService/getJejucultureExhibitionList';

export default defineEventHandler(async (event) => {
  // 보안 검증: GitHub Actions, Cloudflare Workers Scheduled, 또는 관리자만 접근 가능
  const userAgent = getHeader(event, 'user-agent') || '';
  const cronSource = getHeader(event, 'x-cron-source') || '';
  const adminTrigger = getHeader(event, 'x-admin-trigger') || '';
  const cfScheduled = getHeader(event, 'cf-scheduled') || '';

  const isValidCronRequest = userAgent.includes('GitHub-Actions') ||
                            userAgent.includes('Cloudflare-Workers') ||
                            cronSource === 'github-actions' ||
                            cronSource === 'github-actions-manual' ||
                            cronSource === 'cloudflare-scheduled' ||
                            cfScheduled === 'true' ||
                            (adminTrigger === 'true' && cronSource === 'admin-manual');

  if (!isValidCronRequest) {
    console.log(`[${new Date().toISOString()}] Unauthorized cron request blocked. User-Agent: ${userAgent}, Cron-Source: ${cronSource}, Admin-Trigger: ${adminTrigger}`);
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'This endpoint is only accessible via scheduled cron jobs or admin triggers.'
    });
  }

  let attempt = 0;
  let success = false;
  let processedCount = 0;
  const startTime = new Date();

  console.log(`[${new Date().toISOString()}] Starting ${SOURCE_NAME} data fetch cron job. Source: ${cronSource}`);

  try {
    while (attempt <= MAX_RETRIES && !success) {
      try {
        attempt++;
        console.log(`[${new Date().toISOString()}] Attempt ${attempt} to fetch ${SOURCE_NAME} data.`);

        const allRawDataItems = [];
        let currentPage = 1;
        let hasMorePages = true;
        const PAGE_SIZE = 9000;

        while (hasMorePages) {
          console.log(`[${new Date().toISOString()}] Fetching page ${currentPage} from ${API_URL}`);
          const apiUrlWithPage = `${API_URL}?page=${currentPage}&pageSize=${PAGE_SIZE}`;

          // HTTP API 안전 호출
          const apiResult = await callHttpApi(apiUrlWithPage);

          if (!apiResult.success) {
            throw new Error(`Exhibitions API failed: ${apiResult.error}`);
          }

          const response = apiResult.data;

          if (response && response.items && Array.isArray(response.items)) {
            console.log(`[${new Date().toISOString()}] Received ${response.items.length} items from page ${currentPage}`);
            allRawDataItems.push(...response.items);
            hasMorePages = response.items.length >= PAGE_SIZE;
            currentPage++;
          } else {
            console.log(`[${new Date().toISOString()}] No items received or invalid format from page ${currentPage}`);
            hasMorePages = false;
          }
        }

        console.log(`[${new Date().toISOString()}] Fetched total ${allRawDataItems.length} items from external API.`);

        // 배치 처리를 위한 데이터 준비
        const exhibitionDataList: exhibitionDAO.Exhibition[] = [];

        for (const item of allRawDataItems) {
          try {
            // 기존 데이터 확인하여 is_exposed 값 유지
            const existingExhibition = await exhibitionDAO.getExhibitionByOriginalApiId(item.seq.toString());
            
            const exhibitionData: exhibitionDAO.Exhibition = {
              original_api_id: item.seq.toString(),
              title: item.title || '',
              content_html: item.contents || '',
              source_url: item.url || '',
              writer_name: item.writer || '',
              written_date: new Date(item.writeDate) || new Date(),
              files_info: item.files || [],
              api_raw_data: item,
              // 기존 데이터가 있으면 기존 is_exposed 값 유지, 없으면 false (새 데이터)
              is_exposed: existingExhibition ? existingExhibition.is_exposed : false
            };

            exhibitionDataList.push(exhibitionData);
            processedCount++;
          } catch (itemError: any) {
            console.error(`[${new Date().toISOString()}] Error processing item:`, itemError.message);
            await logDAO.createSystemErrorLog({
              error_type: 'ITEM_PROCESSING_ERROR',
              error_message: `Error processing exhibition item: ${itemError.message}`,
              error_details: JSON.stringify({
                item_id: item.seq,
                error: itemError.message,
                stack: itemError.stack
              })
            });
          }
        }

        // 배치로 DB에 데이터 저장/업데이트 (upsert)
        if (exhibitionDataList.length > 0) {
          console.log(`[${new Date().toISOString()}] Batch upserting ${exhibitionDataList.length} exhibitions`);
          const batchResult = await exhibitionDAO.batchUpsertExhibitions(exhibitionDataList);
          if (batchResult.error) {
            console.error(`[${new Date().toISOString()}] Batch upsert failed:`, batchResult.error);
          } else {
            console.log(`[${new Date().toISOString()}] Batch upsert successful: ${batchResult.insertedCount} exhibitions processed`);
          }
        }

        success = true;
        console.log(`[${new Date().toISOString()}] ${SOURCE_NAME} data processing successful for attempt ${attempt}.`);

      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error during fetch attempt ${attempt} for ${SOURCE_NAME}:`, error.message);

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

        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    await logDAO.createApiFetchLog({
      source_name: SOURCE_NAME,
      fetch_timestamp: startTime,
      status: 'SUCCESS',
      retry_count: attempt,
      processed_items: processedCount
    });

    console.log(`[${new Date().toISOString()}] ${SOURCE_NAME} cron job finished successfully. Processed: ${processedCount}`);

    return {
      status: 'success',
      source: SOURCE_NAME,
      recordsProcessed: processedCount,
      attempts: attempt,
      message: `${SOURCE_NAME} data fetched successfully.`
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Critical error in ${SOURCE_NAME} cron job:`, error.message);

    if (!success) {
        try {
            await logDAO.createApiFetchLog({
                source_name: SOURCE_NAME,
                fetch_timestamp: startTime,
                status: 'FAILURE',
                retry_count: attempt,
                processed_items: processedCount,
                error_message: `Critical error: ${error.message}`,
                error_details: error.stack
            });
        } catch (logError: any) {
            console.error(`[${new Date().toISOString()}] Failed to write final failure log for ${SOURCE_NAME}:`, logError.message);
        }
    }

    return {
      status: 'failure',
      source: SOURCE_NAME,
      message: error.message,
      attempts: attempt,
      recordsProcessed: processedCount
    };
  }
});

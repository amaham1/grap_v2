// server/api/cron/welfare-services.ts - Supabase DAO 사용
import { defineEventHandler } from 'h3';
import { welfareServiceDAO, logDAO } from '~/server/dao/supabase';

const MAX_RETRIES = 2;
const SOURCE_NAME = 'welfare_services';
const API_URL = 'https://www.jeju.go.kr/api/jejutoseoul/welfare';

export default defineEventHandler(async (event) => {
  let attempt = 0;
  let success = false;
  let processedCount = 0;
  const startTime = new Date();

  console.log(`[${new Date().toISOString()}] Starting ${SOURCE_NAME} data fetch cron job.`);

  try {
    while (attempt <= MAX_RETRIES && !success) {
      try {
        attempt++;
        console.log(`[${new Date().toISOString()}] Attempt ${attempt} to fetch ${SOURCE_NAME} data.`);

        const allRawDataItems = [];
        let currentPage = 1;
        let hasMorePages = true;
        const PAGE_SIZE = 20;

        while (hasMorePages) {
          console.log(`[${new Date().toISOString()}] Fetching page ${currentPage} from ${API_URL}`);
          const apiUrlWithPage = `${API_URL}?page=${currentPage}&pageSize=${PAGE_SIZE}`;

          const response = await $fetch(apiUrlWithPage, { method: 'GET' });

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

        for (const item of allRawDataItems) {
          try {
            const welfareData: welfareServiceDAO.WelfareService = {
              original_api_id: item.seq.toString(),
              service_name: item.serviceName || '',
              is_all_location: item.isAllLocation === 'Y',
              is_jeju_location: item.isJejuLocation === 'Y',
              is_seogwipo_location: item.isSeogwipoLocation === 'Y',
              support_target_html: item.supportTarget || '',
              support_content_html: item.supportContent || '',
              application_info_html: item.applicationInfo || '',
              api_raw_data: item,
              is_exposed: false
            };

            await welfareServiceDAO.upsertWelfareService(welfareData);
            processedCount++;
          } catch (itemError: any) {
            console.error(`[${new Date().toISOString()}] Error processing item:`, itemError.message);
            await logDAO.createSystemErrorLog({
              error_type: 'ITEM_PROCESSING_ERROR',
              error_message: `Error processing welfare service item: ${itemError.message}`,
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

// server/api/cron/exhibitions.ts
import { defineEventHandler } from 'h3';

import xml2js from 'xml2js';

import { exhibitionDAO, logDAO } from '~/server/dao/supabase';

const MAX_RETRIES = 1; // 최대 재시도 횟수
const SOURCE_NAME = 'exhibitions'; // 데이터 소스명
const API_URL = 'https://www.jeju.go.kr/rest/JejuExhibitionService/getJejucultureExhibitionList'; // 제주문화예술진흥원 공연/전시 정보 API

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
        const PAGE_SIZE = 9000; // 한 번에 가져올 데이터 수

        while (hasMorePages) {
          console.log(`[${new Date().toISOString()}] Fetching page ${currentPage} from ${API_URL}`);
          const apiUrlWithPage = `${API_URL}?page=${currentPage}&pageSize=${PAGE_SIZE}`;

          // $fetch를 사용하여 API 호출 (응답은 기본적으로 문자열)
          const rawResponse = await $fetch(apiUrlWithPage, { method: 'GET' });
          // Log the raw response to inspect its content before parsing
          console.log(`[${new Date().toISOString()}] Raw XML response from ${apiUrlWithPage}:\n`, rawResponse);

          let jsonData: any;
          try {
            // XML 문자열을 JS 객체로 변환 (XML 파싱 전용)
            const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
            jsonData = await parser.parseStringPromise(rawResponse as string);
          } catch (parseError: any) {
            console.error(`[${new Date().toISOString()}] Error parsing XML response:`, parseError.message);
            await logDAO.createSystemErrorLog(connection, {
              error_timestamp: new Date(),
              error_code: 'XML_PARSE_ERROR',
              message: `Error parsing XML response from ${SOURCE_NAME} API: ${parseError.message}`,
              details: (parseError as Error).stack,
              request_path: apiUrlWithPage,
              request_method: 'GET',
              resolved_status: false
            });
            hasMorePages = false;
            throw parseError;
          }

          // XML 파싱 성공. 이제 API 응답 코드 확인.
          const apiData = jsonData.jejunetApi;
          if (!apiData || apiData.resultCode !== '00') {
            const errorCode = apiData?.resultCode || 'unknown';
            const errorMessage = apiData?.resultMsg || 'API returned an error without a message or with unexpected structure.';
            console.error(`[${new Date().toISOString()}] API error. Code: ${errorCode}, Message: ${errorMessage}`);
            // 이 에러는 외부 catch로 전파되어 재시도/실패 처리되어야 함
            throw new Error(`API Error: Code ${errorCode} - ${errorMessage}`);
          }

          // API 응답 코드가 '00' (성공)인 경우 데이터 처리
          const itemsContainer = apiData.items;
          const items = itemsContainer && itemsContainer.item ? itemsContainer.item : [];
          // totalCount는 이 API 응답에 없으므로, items.length를 기반으로 페이지네이션 결정

          const itemsArray = Array.isArray(items) ? items : (items ? [items] : []);

          console.log(`[${new Date().toISOString()}] Received ${itemsArray.length} items from page ${currentPage}.`);

          if (itemsArray.length > 0) {
            allRawDataItems.push(...itemsArray);

            // totalCount가 없으므로, 현재 받아온 아이템 수가 PAGE_SIZE와 같거나 크면 다음 페이지가 있다고 가정
            hasMorePages = itemsArray.length >= PAGE_SIZE;
            if (hasMorePages) {
              currentPage++;
            }
          } else {
            hasMorePages = false;
          }

          // 테스트 시에는 첫 페이지만 가져오도록 제한할 수 있습니다
          // hasMorePages = false;
        }

        console.log(`[${new Date().toISOString()}] Fetched total ${allRawDataItems.length} items from external API.`);

        // 2. DB 스키마에 맞게 데이터 매핑
        console.log(`[${new Date().toISOString()}] Mapping ${allRawDataItems.length} items for ${SOURCE_NAME}.`);
        const exhibitionDataArray: exhibitionDAO.Exhibition[] = allRawDataItems.map(item => {
          let startDate: Date | null = null;
          if (item.start && typeof item.start === 'string') {
            const parts = item.start.split('-');
            if (parts.length === 3) {
              startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
          }

          let endDate: Date | null = null;
          if (item.end && typeof item.end === 'string') {
            const parts = item.end.split('-');
            if (parts.length === 3) {
              endDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
          }

          return {
            original_api_id: item.seq.toString(),
            title: item.title || '',
            category_name: item.categoryName || '',
            cover_image_url: item.cover || '',
            start_date: startDate || new Date(0),
            end_date: endDate || new Date(0),
            time_info: item.hour || '',
            pay_info: item.pay || '',
            location_name: item.locNames || '',
            organizer_info: item.owner || '',
            tel_number: item.tel || '',
            status_info: item.stat || '',
            division_name: item.divName || '',
            api_raw_data: item,
            is_exposed: false,
            fetched_at: new Date()
          };
        });

        // 3. DAO를 사용하여 DB에 데이터 일괄 저장/업데이트 (batch upsert)
        if (exhibitionDataArray.length > 0) {
          console.log(`[${new Date().toISOString()}] Starting batch upsert for ${exhibitionDataArray.length} items.`);
          const batchResult = await exhibitionDAO.batchUpsertExhibitions(connection, exhibitionDataArray);
          processedCount = batchResult.processedCount;
          newItemsCount = batchResult.newItemsCount;
          updatedItemsCount = batchResult.updatedItemsCount;
          console.log(`[${new Date().toISOString()}] Batch upsert completed. Processed: ${processedCount}, New: ${newItemsCount}, Updated: ${updatedItemsCount}`);
        } else {
          console.log(`[${new Date().toISOString()}] No items to batch upsert.`);
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
      // 현재 로직상 실패 시 throw되어 외부 catch에서 rollback 되므로, 여기가 반드시 필요한 것은 아닐 수 있으나 방어적으로 추가
      if (connection) { // 연결이 살아있다면
        console.warn(`[${new Date().toISOString()}] Job finished without success, attempting rollback. Source: ${SOURCE_NAME}`);
        await connection.rollback();
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
        await connection.rollback(); // 오류 발생 시 롤백
        console.log(`[${new Date().toISOString()}] Transaction rolled back for ${SOURCE_NAME} due to critical error.`);
      } catch (rollbackError: any) {
        console.error(`[${new Date().toISOString()}] Error during rollback for ${SOURCE_NAME}:`, rollbackError.message);
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

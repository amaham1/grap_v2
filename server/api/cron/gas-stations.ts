// server/api/cron/gas-stations.ts
import { defineEventHandler, getHeader, createError } from 'h3';
import { gasStationDAO, logDAO } from '~/server/dao/supabase';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'gas_stations'; // 데이터 소스명
const API_KEY = '860665'; // 제주도 API 키
const GAS_INFO_API_URL = `http://api.jejuits.go.kr/api/infoGasInfoList?code=${API_KEY}`;
const GAS_PRICE_API_URL = `http://api.jejuits.go.kr/api/infoGasPriceList?code=${API_KEY}`;

export default defineEventHandler(async (event) => {
  // 보안 검증: GitHub Actions 또는 관리자만 접근 가능
  const userAgent = getHeader(event, 'user-agent') || '';
  const cronSource = getHeader(event, 'x-cron-source') || '';
  const adminTrigger = getHeader(event, 'x-admin-trigger') || '';

  const isValidCronRequest = userAgent.includes('GitHub-Actions') ||
                            cronSource === 'github-actions' ||
                            cronSource === 'github-actions-manual' ||
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
  let processedStations = 0;
  let processedPrices = 0;
  const startTime = new Date();

  console.log(`[${new Date().toISOString()}] Starting ${SOURCE_NAME} data fetch cron job. Source: ${cronSource}`);

  try {
    while (attempt <= MAX_RETRIES && !success) {
      try {
        attempt++;
        console.log(`[${new Date().toISOString()}] Attempt ${attempt} to fetch ${SOURCE_NAME} data.`);

        // 1. 주유소 기본 정보 가져오기
        console.log(`[${new Date().toISOString()}] Fetching gas station info from ${GAS_INFO_API_URL}`);
        const infoResponse = await $fetch(GAS_INFO_API_URL, { method: 'GET' });

        if (infoResponse && infoResponse.info && Array.isArray(infoResponse.info)) {
          console.log(`[${new Date().toISOString()}] Received ${infoResponse.info.length} gas station info items`);

          // 주유소 정보 처리
          for (const item of infoResponse.info) {
            try {
              const gasStationData: gasStationDAO.GasStation = {
                opinet_id: item.id || '',
                station_name: item.osnm || '',
                brand_code: item.poll || '',
                brand_name: item.poll || '',
                gas_brand_code: item.gpoll || '',
                gas_brand_name: item.gpoll || '',
                zip_code: item.zip || '',
                address: item.adr || '',
                phone: item.tel || '',
                station_type: item.lpgyn === 'Y' ? 'Y' : 'N',
                katec_x: parseFloat(item.gisxcoor) || null,
                katec_y: parseFloat(item.gisycoor) || null,
                latitude: null, // API에서 제공하지 않음
                longitude: null, // API에서 제공하지 않음
                api_raw_data: JSON.stringify(item),
                is_exposed: false
              };

              await gasStationDAO.upsertGasStation(gasStationData);
              processedStations++;
            } catch (itemError: any) {
              console.error(`[${new Date().toISOString()}] Error processing gas station item:`, itemError.message);
              await logDAO.createSystemErrorLog({
                error_type: 'ITEM_PROCESSING_ERROR',
                error_message: `Error processing gas station item: ${itemError.message}`,
                error_details: JSON.stringify({
                  item_id: item.id,
                  error: itemError.message,
                  stack: itemError.stack
                })
              });
            }
          }
        }

        // 2. 주유소 가격 정보 가져오기
        console.log(`[${new Date().toISOString()}] Fetching gas price info from ${GAS_PRICE_API_URL}`);
        const priceResponse = await $fetch(GAS_PRICE_API_URL, { method: 'GET' });

        if (priceResponse && priceResponse.info && Array.isArray(priceResponse.info)) {
          console.log(`[${new Date().toISOString()}] Received ${priceResponse.info.length} gas price items`);

          // 가격 정보 처리
          for (const item of priceResponse.info) {
            try {
              const gasPriceData: gasStationDAO.GasPrice = {
                opinet_id: item.id || '',
                gasoline_price: parseInt(item.gasoline) || 0,
                premium_gasoline_price: parseInt(item.premium_gasoline) || 0,
                diesel_price: parseInt(item.diesel) || 0,
                lpg_price: parseInt(item.lpg) || 0,
                price_date: item.price_date || new Date().toISOString().split('T')[0],
                api_raw_data: JSON.stringify(item)
              };

              await gasStationDAO.upsertGasPrice(gasPriceData);
              processedPrices++;
            } catch (itemError: any) {
              console.error(`[${new Date().toISOString()}] Error processing gas price item:`, itemError.message);
              await logDAO.createSystemErrorLog({
                error_type: 'ITEM_PROCESSING_ERROR',
                error_message: `Error processing gas price item: ${itemError.message}`,
                error_details: JSON.stringify({
                  item_id: item.id,
                  error: itemError.message,
                  stack: itemError.stack
                })
              });
            }
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
            request_path: `${GAS_INFO_API_URL}, ${GAS_PRICE_API_URL}`,
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
            processed_items: processedStations + processedPrices,
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
      processed_items: processedStations + processedPrices
    });

    console.log(`[${new Date().toISOString()}] ${SOURCE_NAME} cron job finished successfully. Processed: ${processedStations} stations, ${processedPrices} prices`);

    return {
      status: 'success',
      source: SOURCE_NAME,
      recordsProcessed: processedStations + processedPrices,
      stationsProcessed: processedStations,
      pricesProcessed: processedPrices,
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
                processed_items: processedStations + processedPrices,
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
      recordsProcessed: processedStations + processedPrices
    };
  }
});

// server/api/cron/gas-stations.ts
import { defineEventHandler, getHeader, createError } from 'h3';
import { gasStationDAO, logDAO } from '~/server/dao/supabase';
import { convertKatecToWgs84 } from '~/utils/gasStationUtils';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'gas_stations'; // 데이터 소스명
const API_KEY = '860665'; // 제주도 API 키
const GAS_INFO_API_URL = `http://api.jejuits.go.kr/api/infoGasInfoList?code=${API_KEY}`;
const GAS_PRICE_API_URL = `http://api.jejuits.go.kr/api/infoGasPriceList?code=${API_KEY}`;

// Cloudflare Workers 최적화 설정
const BATCH_SIZE = 50; // 배치 처리 크기 (Cloudflare Workers CPU 시간 제한 고려)
const PROCESSING_TIMEOUT = 25000; // 25초 타임아웃 (Cloudflare Workers 30초 제한 고려)

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
  let processedStations = 0;
  let processedPrices = 0;
  const startTime = Date.now();

  console.log(`[${new Date().toISOString()}] Starting ${SOURCE_NAME} data fetch cron job. Source: ${cronSource}`);

  try {
    while (attempt <= MAX_RETRIES && !success) {
      try {
        attempt++;
        console.log(`[${new Date().toISOString()}] Attempt ${attempt} to fetch ${SOURCE_NAME} data.`);

        // Cloudflare Workers 타임아웃 체크
        if (Date.now() - startTime > PROCESSING_TIMEOUT) {
          console.warn(`[${new Date().toISOString()}] Processing timeout reached (${PROCESSING_TIMEOUT}ms), stopping execution`);
          throw new Error('Processing timeout reached');
        }

        // 1. 주유소 기본 정보 가져오기
        console.log(`[${new Date().toISOString()}] Fetching gas station info from ${GAS_INFO_API_URL}`);
        const infoResponse = await $fetch(GAS_INFO_API_URL, { method: 'GET' });

        if (infoResponse && infoResponse.info && Array.isArray(infoResponse.info)) {
          console.log(`[${new Date().toISOString()}] Received ${infoResponse.info.length} gas station info items`);

          // 배치 처리를 위한 데이터 준비
          const gasStationDataList: gasStationDAO.GasStation[] = [];
          let coordConvertSuccess = 0;
          let coordConvertFailed = 0;

          console.log(`[${new Date().toISOString()}] Processing ${infoResponse.info.length} gas stations with coordinate conversion`);

          for (let i = 0; i < infoResponse.info.length; i++) {
            const item = infoResponse.info[i];

            try {
              // 타임아웃 체크 (매 10개 아이템마다)
              if (i % 10 === 0 && Date.now() - startTime > PROCESSING_TIMEOUT) {
                console.warn(`[${new Date().toISOString()}] Processing timeout reached during station processing at item ${i}`);
                break;
              }

              // KATEC 좌표를 WGS84 좌표로 변환
              const katecX = parseFloat(item.gisxcoor) || null;
              const katecY = parseFloat(item.gisycoor) || null;
              let latitude = null;
              let longitude = null;

              if (katecX && katecY) {
                const convertedCoords = convertKatecToWgs84(katecX, katecY);
                if (convertedCoords) {
                  latitude = convertedCoords.latitude;
                  longitude = convertedCoords.longitude;
                  coordConvertSuccess++;

                  // 처음 5개만 상세 로그 출력
                  if (coordConvertSuccess <= 5) {
                    console.log(`[${new Date().toISOString()}] 좌표 변환 성공: ${item.osnm} - KATEC(${katecX}, ${katecY}) → WGS84(${latitude}, ${longitude})`);
                  }
                } else {
                  coordConvertFailed++;
                  if (coordConvertFailed <= 3) {
                    console.warn(`[${new Date().toISOString()}] 좌표 변환 실패: ${item.osnm} - KATEC(${katecX}, ${katecY})`);
                  }
                }
              }

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
                katec_x: katecX,
                katec_y: katecY,
                latitude: latitude,
                longitude: longitude,
                api_raw_data: JSON.stringify(item),
                is_exposed: latitude !== null && longitude !== null // 좌표 변환이 성공한 경우에만 노출
              };

              gasStationDataList.push(gasStationData);
            } catch (itemError: any) {
              console.error(`[${new Date().toISOString()}] Error processing gas station item ${i}:`, itemError.message);
              await logDAO.createSystemErrorLog({
                error_type: 'ITEM_PROCESSING_ERROR',
                error_message: `Error processing gas station item: ${itemError.message}`,
                error_details: JSON.stringify({
                  item_id: item.id,
                  item_index: i,
                  error: itemError.message,
                  stack: itemError.stack
                })
              });
            }
          }

          console.log(`[${new Date().toISOString()}] Coordinate conversion summary: ${coordConvertSuccess} success, ${coordConvertFailed} failed`);

          // 배치로 주유소 정보 저장/업데이트
          if (gasStationDataList.length > 0) {
            console.log(`[${new Date().toISOString()}] Batch upserting ${gasStationDataList.length} gas stations`);
            const batchResult = await gasStationDAO.batchUpsertGasStations(gasStationDataList);
            if (batchResult.error) {
              console.error(`[${new Date().toISOString()}] Batch upsert failed:`, batchResult.error);
              throw new Error(`Gas stations batch upsert failed: ${batchResult.error}`);
            } else {
              console.log(`[${new Date().toISOString()}] Batch upsert successful: ${batchResult.insertedCount} stations processed`);
              processedStations = batchResult.insertedCount || gasStationDataList.length;
            }
          }
        }

        // 2. 주유소 가격 정보 가져오기
        console.log(`[${new Date().toISOString()}] Fetching gas price info from ${GAS_PRICE_API_URL}`);
        const priceResponse = await $fetch(GAS_PRICE_API_URL, { method: 'GET' });

        if (priceResponse && priceResponse.info && Array.isArray(priceResponse.info)) {
          console.log(`[${new Date().toISOString()}] Received ${priceResponse.info.length} gas price items`);

          // 배치 처리를 위한 데이터 준비
          const gasPriceDataList: gasStationDAO.GasPrice[] = [];

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

              gasPriceDataList.push(gasPriceData);
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

          // 배치로 가격 정보 저장/업데이트
          if (gasPriceDataList.length > 0) {
            console.log(`[${new Date().toISOString()}] Batch upserting ${gasPriceDataList.length} gas prices`);
            const batchResult = await gasStationDAO.batchUpsertGasPrices(gasPriceDataList);
            if (batchResult.error) {
              console.error(`[${new Date().toISOString()}] Batch upsert failed:`, batchResult.error);
              throw new Error(`Gas prices batch upsert failed: ${batchResult.error}`);
            } else {
              console.log(`[${new Date().toISOString()}] Batch upsert successful: ${batchResult.insertedCount} prices processed`);
              processedPrices = batchResult.insertedCount || gasPriceDataList.length;
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
            fetch_timestamp: new Date(startTime),
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
      fetch_timestamp: new Date(startTime),
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
                fetch_timestamp: new Date(startTime),
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

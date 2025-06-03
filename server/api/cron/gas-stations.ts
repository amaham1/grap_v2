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
const BATCH_SIZE = 30; // 배치 처리 크기 감소 (좌표 변환 시간 고려)
const PROCESSING_TIMEOUT = 150000; // 2.5분 타임아웃 (좌표 변환으로 인한 시간 증가 고려)
const COORDINATE_CONVERSION_TIMEOUT = 5000; // 개별 좌표 변환 타임아웃 5초

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

          // 배치 단위로 병렬 처리
          for (let batchStart = 0; batchStart < infoResponse.info.length; batchStart += BATCH_SIZE) {
            // 타임아웃 체크
            if (Date.now() - startTime > PROCESSING_TIMEOUT) {
              console.warn(`[${new Date().toISOString()}] Processing timeout reached during batch processing at item ${batchStart}`);
              break;
            }

            const batchEnd = Math.min(batchStart + BATCH_SIZE, infoResponse.info.length);
            const batch = infoResponse.info.slice(batchStart, batchEnd);

            console.log(`[${new Date().toISOString()}] Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: items ${batchStart + 1}-${batchEnd}`);

            // 배치 내에서 병렬 좌표 변환 처리
            const batchPromises = batch.map(async (item, index) => {
              try {
                const katecX = parseFloat(item.gisxcoor) || null;
                const katecY = parseFloat(item.gisycoor) || null;
                let latitude = null;
                let longitude = null;

                if (katecX && katecY) {
                  try {
                    const convertedCoords = await convertKatecToWgs84(katecX, katecY, COORDINATE_CONVERSION_TIMEOUT);
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
                  } catch (coordError) {
                    console.error(`[${new Date().toISOString()}] 좌표 변환 중 오류: ${item.osnm} - KATEC(${katecX}, ${katecY})`, coordError);
                    coordConvertFailed++;
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

                return gasStationData;
              } catch (itemError: any) {
                console.error(`[${new Date().toISOString()}] Error processing gas station item ${batchStart + index}:`, itemError.message);
                await logDAO.createSystemErrorLog({
                  error_type: 'ITEM_PROCESSING_ERROR',
                  error_message: `Error processing gas station item: ${itemError.message}`,
                  error_details: JSON.stringify({
                    item_id: item.id,
                    item_index: batchStart + index,
                    error: itemError.message,
                    stack: itemError.stack
                  })
                });
                return null;
              }
            });

            // 배치 처리 완료 대기
            const batchResults = await Promise.allSettled(batchPromises);

            // 성공한 결과만 추가
            batchResults.forEach((result) => {
              if (result.status === 'fulfilled' && result.value) {
                gasStationDataList.push(result.value);
              }
            });

            console.log(`[${new Date().toISOString()}] Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} completed. Total processed: ${gasStationDataList.length}`);
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

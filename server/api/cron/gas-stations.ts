// server/api/cron/gas-stations.ts
import { defineEventHandler, getHeader, createError } from 'h3';
import { gasStationDAO, logDAO } from '~/server/dao/supabase';
import { convertKatecToWgs84 } from '~/utils/gasStationUtils';
import { callJejuApi } from '~/server/utils/httpApiClient';
import { safelyBatchUpsertGasPrices } from '~/server/utils/gasPriceErrorHandler';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'gas_stations'; // 데이터 소스명
const API_KEY = '860665'; // 제주도 API 키

// HTTP API URLs - 서버 사이드에서만 호출 (클라우드플레어에서 Mixed Content 차단 방지)
const GAS_INFO_API_URL = `http://api.jejuits.go.kr/api/infoGasInfoList?code=${API_KEY}`;
const GAS_PRICE_API_URL = `http://api.jejuits.go.kr/api/infoGasPriceList?code=${API_KEY}`;

// Cloudflare Workers 최적화 설정 - 타임아웃 문제 해결
const BATCH_SIZE = 50; // 배치 처리 크기 증가 (성능 개선)
const PROCESSING_TIMEOUT = 270000; // 4.5분 타임아웃 (191초 실패 경험 반영)
const COORDINATE_CONVERSION_TIMEOUT = 3000; // 개별 좌표 변환 타임아웃 3초 (속도 개선)

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

        // 1. 주유소 기본 정보 가져오기 (HTTP API 안전 호출)
        console.log(`[${new Date().toISOString()}] Fetching gas station info from ${GAS_INFO_API_URL}`);
        const infoApiResult = await callJejuApi(GAS_INFO_API_URL.replace(`?code=${API_KEY}`, ''), API_KEY);

        if (!infoApiResult.success) {
          throw new Error(`Gas station info API failed: ${infoApiResult.error}`);
        }

        const infoResponse = infoApiResult.data;

        if (infoResponse && infoResponse.info && Array.isArray(infoResponse.info)) {
          console.log(`[${new Date().toISOString()}] Received ${infoResponse.info.length} gas station info items`);

          // 배치 처리를 위한 데이터 준비
          const gasStationDataList: gasStationDAO.GasStation[] = [];
          let coordConvertSuccess = 0;
          let coordConvertFailed = 0;

          console.log(`🔄 [GAS-STATIONS] ${infoResponse.info.length}개 주유소 좌표 변환 및 처리 시작`);
          console.log(`📍 [GAS-STATIONS] 좌표 변환 정보:`);
          console.log(`  - 원본 좌표계: KATEC (Korean Transverse Mercator)`);
          console.log(`  - 변환 좌표계: WGS84 (World Geodetic System 1984)`);
          console.log(`  - 변환 API: 카카오 좌표 변환 API`);
          console.log(`  - 배치 크기: ${BATCH_SIZE}개씩 처리`);
          console.log(`  - 변환 타임아웃: ${COORDINATE_CONVERSION_TIMEOUT}ms`);

          // 배치 단위로 병렬 처리
          for (let batchStart = 0; batchStart < infoResponse.info.length; batchStart += BATCH_SIZE) {
            // 타임아웃 체크
            if (Date.now() - startTime > PROCESSING_TIMEOUT) {
              console.warn(`⏰ [GAS-STATIONS] 전체 처리 타임아웃 도달 (${batchStart}번째 항목에서 중단)`);
              break;
            }

            const batchEnd = Math.min(batchStart + BATCH_SIZE, infoResponse.info.length);
            const batch = infoResponse.info.slice(batchStart, batchEnd);
            const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(infoResponse.info.length / BATCH_SIZE);

            console.log(`📦 [GAS-STATIONS] 배치 ${batchNumber}/${totalBatches} 처리 중: ${batchStart + 1}-${batchEnd}번째 주유소`);

            // 배치 내에서 병렬 좌표 변환 처리
            const batchPromises = batch.map(async (item, index) => {
              try {
                const katecX = parseFloat(item.gisxcoor) || null;
                const katecY = parseFloat(item.gisycoor) || null;
                let latitude = null;
                let longitude = null;

                if (katecX && katecY) {
                  try {
                    const convertStartTime = Date.now();
                    const convertedCoords = await convertKatecToWgs84(katecX, katecY, COORDINATE_CONVERSION_TIMEOUT);
                    const convertDuration = Date.now() - convertStartTime;

                    if (convertedCoords) {
                      latitude = convertedCoords.latitude;
                      longitude = convertedCoords.longitude;
                      coordConvertSuccess++;

                      // 처음 5개만 상세 로그 출력
                      if (coordConvertSuccess <= 5) {
                        console.log(`✅ [COORD-CONVERT] ${item.osnm} 좌표 변환 성공 (${convertDuration}ms)`);
                        console.log(`  📍 KATEC: X=${katecX}, Y=${katecY}`);
                        console.log(`  🌍 WGS84: 위도=${latitude}, 경도=${longitude}`);
                        console.log(`  🔗 카카오 API 응답 시간: ${convertDuration}ms`);
                      } else if (coordConvertSuccess % 50 === 0) {
                        // 50개마다 진행 상황 로그
                        console.log(`📊 [COORD-CONVERT] 진행 상황: ${coordConvertSuccess}개 변환 완료`);
                      }
                    } else {
                      coordConvertFailed++;
                      if (coordConvertFailed <= 3) {
                        console.warn(`❌ [COORD-CONVERT] ${item.osnm} 좌표 변환 실패 (${convertDuration}ms)`);
                        console.warn(`  📍 KATEC: X=${katecX}, Y=${katecY}`);
                        console.warn(`  🔧 원인: 카카오 API에서 null 응답 반환`);
                      }
                    }
                  } catch (coordError: any) {
                    coordConvertFailed++;
                    if (coordConvertFailed <= 3) {
                      console.error(`💥 [COORD-CONVERT] ${item.osnm} 좌표 변환 중 오류`);
                      console.error(`  📍 KATEC: X=${katecX}, Y=${katecY}`);
                      console.error(`  🔍 오류 상세: ${coordError.message}`);
                      console.error(`  🔧 해결 방안:`);
                      console.error(`    1. 카카오 API 키 확인 (d806ae809740b6a6e114067f7326bd38)`);
                      console.error(`    2. 네트워크 연결 상태 확인`);
                      console.error(`    3. 좌표 값 유효성 확인`);
                    }
                  }
                } else {
                  // KATEC 좌표가 없는 경우
                  if (coordConvertFailed <= 3) {
                    console.warn(`⚠️ [COORD-CONVERT] ${item.osnm} KATEC 좌표 누락`);
                    console.warn(`  📍 gisxcoor: ${item.gisxcoor}, gisycoor: ${item.gisycoor}`);
                  }
                  coordConvertFailed++;
                }

                const normalizedId = (item.id || '').trim();
                if (!normalizedId) {
                  // 빈 ID는 스킵
                  return null;
                }

                const gasStationData: gasStationDAO.GasStation = {
                  opinet_id: normalizedId,
                  station_name: (item.osnm || '').trim(),
                  brand_code: (item.poll || '').trim(),
                  brand_name: (item.poll || '').trim(),
                  gas_brand_code: (item.gpoll || '').trim(),
                  gas_brand_name: (item.gpoll || '').trim(),
                  zip_code: (item.zip || '').trim(),
                  address: (item.adr || '').trim(),
                  phone: (item.tel || '').trim(),
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

            const batchSuccessRate = batchResults.filter(r => r.status === 'fulfilled' && r.value).length;
            const batchFailureRate = batchResults.length - batchSuccessRate;

            console.log(`✅ [GAS-STATIONS] 배치 ${batchNumber} 완료: 성공 ${batchSuccessRate}개, 실패 ${batchFailureRate}개`);
            console.log(`📊 [GAS-STATIONS] 전체 진행률: ${gasStationDataList.length}/${infoResponse.info.length} (${Math.round(gasStationDataList.length / infoResponse.info.length * 100)}%)`);
          }

          // 좌표 변환 최종 요약
          const totalProcessed = coordConvertSuccess + coordConvertFailed;
          const successRate = totalProcessed > 0 ? Math.round(coordConvertSuccess / totalProcessed * 100) : 0;

          console.log(`🎯 [COORD-CONVERT] 좌표 변환 최종 요약:`);
          console.log(`  ✅ 성공: ${coordConvertSuccess}개 (${successRate}%)`);
          console.log(`  ❌ 실패: ${coordConvertFailed}개 (${100 - successRate}%)`);
          console.log(`  📊 총 처리: ${totalProcessed}개`);
          console.log(`  🎯 노출 가능 주유소: ${coordConvertSuccess}개 (좌표 변환 성공한 주유소만 노출)`);

          if (coordConvertFailed > 0) {
            console.warn(`⚠️ [COORD-CONVERT] 좌표 변환 실패 원인 분석:`);
            console.warn(`  1. 카카오 API 응답 지연 또는 오류`);
            console.warn(`  2. 잘못된 KATEC 좌표 값`);
            console.warn(`  3. 네트워크 연결 문제`);
            console.warn(`  4. API 키 제한 또는 만료`);
          }

          // 배치로 주유소 정보 저장/업데이트
          if (gasStationDataList.length > 0) {
            const dbStartTime = Date.now();
            console.log(`💾 [DATABASE] 주유소 정보 데이터베이스 저장 시작`);
            console.log(`📊 [DATABASE] 저장할 데이터: ${gasStationDataList.length}개 주유소`);
            console.log(`🎯 [DATABASE] 노출 설정: 좌표 변환 성공한 ${coordConvertSuccess}개만 노출`);

            const batchResult = await gasStationDAO.batchUpsertGasStations(gasStationDataList);
            const dbDuration = Date.now() - dbStartTime;

            if (batchResult.error) {
              console.error(`❌ [DATABASE] 주유소 정보 저장 실패 (${dbDuration}ms)`);
              console.error(`🔍 [DATABASE] 오류 상세: ${batchResult.error}`);
              console.error(`🔧 [DATABASE] 해결 방안:`);
              console.error(`  1. 데이터베이스 연결 상태 확인`);
              console.error(`  2. Supabase 서비스 상태 확인`);
              console.error(`  3. 데이터 형식 유효성 확인`);
              console.error(`  4. 데이터베이스 용량 확인`);
              throw new Error(`Gas stations batch upsert failed: ${batchResult.error}`);
            } else {
              console.log(`✅ [DATABASE] 주유소 정보 저장 성공 (${dbDuration}ms)`);
              console.log(`📊 [DATABASE] 처리 결과: ${batchResult.insertedCount || gasStationDataList.length}개 주유소 저장/업데이트`);
              console.log(`⚡ [DATABASE] 저장 속도: ${Math.round((batchResult.insertedCount || gasStationDataList.length) / (dbDuration / 1000))} 건/초`);
              processedStations = batchResult.insertedCount || gasStationDataList.length;
            }
          } else {
            console.warn(`⚠️ [DATABASE] 저장할 주유소 데이터가 없습니다.`);
          }
        }

        // 2. 주유소 가격 정보 가져오기 (HTTP API 안전 호출)
        console.log(`⛽ [GAS-PRICES] 주유소 가격 정보 수집 시작`);
        console.log(`📡 [GAS-PRICES] API 호출: ${GAS_PRICE_API_URL}`);

        const priceApiResult = await callJejuApi(GAS_PRICE_API_URL.replace(`?code=${API_KEY}`, ''), API_KEY);

        if (!priceApiResult.success) {
          console.error(`❌ [GAS-PRICES] 가격 정보 API 호출 실패: ${priceApiResult.error}`);
          throw new Error(`Gas price info API failed: ${priceApiResult.error}`);
        }

        const priceResponse = priceApiResult.data;

        if (priceResponse && priceResponse.info && Array.isArray(priceResponse.info)) {
          console.log(`📊 [GAS-PRICES] ${priceResponse.info.length}개 가격 정보 수신`);
          console.log(`💰 [GAS-PRICES] 가격 정보 처리 시작:`);
          console.log(`  - 휘발유 (gasoline) 가격`);
          console.log(`  - 고급휘발유 (premium_gasoline) 가격`);
          console.log(`  - 경유 (diesel) 가격`);
          console.log(`  - LPG 가격`);

          // 배치 처리를 위한 데이터 준비
          const gasPriceDataList: gasStationDAO.GasPrice[] = [];
          let priceProcessingErrors = 0;

          for (const item of priceResponse.info) {
            try {
              const normalizedId = (item.id || '').trim();
              if (!normalizedId) {
                // 빈 ID는 스킵
                continue;
              }

              const gasPriceData: gasStationDAO.GasPrice = {
                opinet_id: normalizedId,
                gasoline_price: parseInt(item.gasoline) || 0,
                premium_gasoline_price: parseInt(item.premium_gasoline) || 0,
                diesel_price: parseInt(item.diesel) || 0,
                lpg_price: parseInt(item.lpg) || 0,
                price_date: item.price_date || new Date().toISOString().split('T')[0],
                api_raw_data: JSON.stringify(item)
              };

              // 처음 3개 가격 정보만 상세 로그 출력
              if (gasPriceDataList.length < 3) {
                console.log(`💰 [GAS-PRICES] 가격 정보 처리 예시 (${gasPriceDataList.length + 1}번째):`);
                console.log(`  🏪 주유소 ID: ${item.id}`);
                console.log(`  ⛽ 휘발유: ${item.gasoline}원`);
                console.log(`  🔥 고급휘발유: ${item.premium_gasoline}원`);
                console.log(`  🚛 경유: ${item.diesel}원`);
                console.log(`  🔋 LPG: ${item.lpg}원`);
                console.log(`  📅 가격 기준일: ${item.price_date}`);
              } else if (gasPriceDataList.length % 100 === 0) {
                // 100개마다 진행 상황 로그
                console.log(`📊 [GAS-PRICES] 진행 상황: ${gasPriceDataList.length}개 가격 정보 처리 완료`);
              }

              gasPriceDataList.push(gasPriceData);
              processedPrices++;
            } catch (itemError: any) {
              priceProcessingErrors++;
              if (priceProcessingErrors <= 3) {
                console.error(`❌ [GAS-PRICES] 가격 정보 처리 오류 (${priceProcessingErrors}번째)`);
                console.error(`  🏪 주유소 ID: ${item.id}`);
                console.error(`  🔍 오류 상세: ${itemError.message}`);
                console.error(`  📄 원본 데이터:`, JSON.stringify(item).substring(0, 200) + '...');
              }

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

          // 가격 정보 처리 요약
          console.log(`🎯 [GAS-PRICES] 가격 정보 처리 완료:`);
          console.log(`  ✅ 성공: ${gasPriceDataList.length}개`);
          console.log(`  ❌ 실패: ${priceProcessingErrors}개`);
          console.log(`  📊 총 처리: ${priceResponse.info.length}개`);

          // 배치로 가격 정보 저장/업데이트 (강화된 오류 처리 포함)
          if (gasPriceDataList.length > 0) {
            const priceDbStartTime = Date.now();
            console.log(`💾 [DATABASE] 가격 정보 데이터베이스 저장 시작`);
            console.log(`📊 [DATABASE] 저장할 가격 데이터: ${gasPriceDataList.length}개`);

            // 안전한 배치 저장 (Foreign Key 검증 및 오류 처리 포함)
            const safeUpsertResult = await safelyBatchUpsertGasPrices(gasPriceDataList);
            const priceDbDuration = Date.now() - priceDbStartTime;

            if (safeUpsertResult.success) {
              console.log(`✅ [DATABASE] 가격 정보 저장 성공 (${priceDbDuration}ms)`);
              console.log(`📊 [DATABASE] 처리 결과: ${safeUpsertResult.processedCount}개 가격 정보 저장/업데이트`);
              console.log(`⚡ [DATABASE] 저장 속도: ${Math.round(safeUpsertResult.processedCount / (priceDbDuration / 1000))} 건/초`);
              processedPrices = safeUpsertResult.processedCount;

              if (safeUpsertResult.skippedCount > 0) {
                console.warn(`⚠️ [DATABASE] ${safeUpsertResult.skippedCount}개의 가격 데이터는 Foreign Key 검증으로 제외됨`);
              }

              // 권장사항 출력
              if (safeUpsertResult.recommendations.length > 0) {
                console.log(`💡 [DATABASE] 권장사항:`);
                safeUpsertResult.recommendations.forEach(rec => console.log(`  ${rec}`));
              }
            } else {
              console.error(`❌ [DATABASE] 가격 정보 저장 실패 (${priceDbDuration}ms)`);
              console.error(`🔍 [DATABASE] 오류 상세: ${safeUpsertResult.error}`);

              // 권장사항 출력
              if (safeUpsertResult.recommendations.length > 0) {
                console.error(`🔧 [DATABASE] 해결 방안:`);
                safeUpsertResult.recommendations.forEach(rec => console.error(`  ${rec}`));
              }

              // 부분적으로라도 처리된 데이터가 있으면 계속 진행
              if (safeUpsertResult.processedCount > 0) {
                console.warn(`⚠️ [DATABASE] 부분적 성공: ${safeUpsertResult.processedCount}개 처리됨`);
                processedPrices = safeUpsertResult.processedCount;
              } else {
                throw new Error(`Gas prices batch upsert failed: ${safeUpsertResult.error}`);
              }
            }
          } else {
            console.warn(`⚠️ [DATABASE] 저장할 가격 데이터가 없습니다.`);
          }
        }

        success = true;
        const totalDuration = Date.now() - startTime;

        console.log(`🎉 [GAS-STATIONS] 주유소 데이터 수집 완료! (시도 ${attempt})`);
        console.log(`⏱️ [GAS-STATIONS] 총 소요 시간: ${Math.round(totalDuration / 1000)}초 (${totalDuration}ms)`);
        console.log(`📊 [GAS-STATIONS] 최종 처리 결과:`);
        console.log(`  🏪 주유소 정보: ${processedStations}개 처리`);
        console.log(`  💰 가격 정보: ${processedPrices}개 처리`);
        console.log(`  📈 총 처리량: ${processedStations + processedPrices}개`);
        console.log(`⚡ [GAS-STATIONS] 평균 처리 속도: ${Math.round((processedStations + processedPrices) / (totalDuration / 1000))} 건/초`);
        console.log(`🎯 [GAS-STATIONS] 다음 자동 수집: 매일 새벽 2시 (KST)`);
        console.log(`📝 [GAS-STATIONS] 수집된 데이터는 주유소 지도에서 확인 가능합니다.`);

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

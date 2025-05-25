// server/api/cron/gas-stations.ts
import { defineEventHandler } from 'h3';
import mysql from 'mysql2/promise';
import { executeQuery } from '~/server/utils/db';
import { gasStationDAO, logDAO } from '~/server/dao';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'gas_stations'; // 데이터 소스명
const API_KEY = '860665'; // 제주도 API 키
const GAS_INFO_API_URL = `http://api.jejuits.go.kr/api/infoGasInfoList?code=${API_KEY}`;
const GAS_PRICE_API_URL = `http://api.jejuits.go.kr/api/infoGasPriceList?code=${API_KEY}`;

export default defineEventHandler(async (event) => {
  let attempt = 0;
  let success = false;
  let processedStationsCount = 0;
  let processedPricesCount = 0;
  let newStationsCount = 0;
  let updatedStationsCount = 0;
  let newPricesCount = 0;
  let updatedPricesCount = 0;
  const startTime = new Date();
  let connection: mysql.Connection | null = null;

  console.log(`[${new Date().toISOString()}] Starting ${SOURCE_NAME} data fetch cron job.`);

  try {
    console.log(`[${new Date().toISOString()}] Creating database connection...`);
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      charset: 'utf8mb4',
      connectTimeout: 60000, // 60초 연결 타임아웃
      socketPath: undefined // 소켓 경로 명시적으로 undefined 설정
    });
    console.log(`[${new Date().toISOString()}] Database connection established successfully.`);

    console.log(`[${new Date().toISOString()}] Starting database transaction...`);
    await connection.beginTransaction(); // 트랜잭션 시작
    console.log(`[${new Date().toISOString()}] Database transaction started successfully.`);

    while (attempt <= MAX_RETRIES && !success) {
      try {
        attempt++;
        console.log(`[${new Date().toISOString()}] Attempt ${attempt} to fetch ${SOURCE_NAME} data.`);

        // 1. 주유소 기본 정보 수집
        console.log(`[${new Date().toISOString()}] Fetching gas station info from ${GAS_INFO_API_URL}`);

        const gasInfoResponse = await $fetch(GAS_INFO_API_URL, {
          method: 'GET',
          timeout: 30000 // 30초 타임아웃
        });

        console.log(`[${new Date().toISOString()}] Gas info API response result:`, gasInfoResponse.result, 'info_cnt:', gasInfoResponse.info_cnt);

        if (!gasInfoResponse || gasInfoResponse.result !== 'success') {
          throw new Error(`Gas station info API returned error: ${JSON.stringify(gasInfoResponse)}`);
        }

        const gasStations = gasInfoResponse.info || [];
        console.log(`[${new Date().toISOString()}] Fetched ${gasStations.length} gas stations from info API.`);

        // 2. 주유소 가격 정보 수집
        console.log(`[${new Date().toISOString()}] Fetching gas price info from ${GAS_PRICE_API_URL}`);

        const gasPriceResponse = await $fetch(GAS_PRICE_API_URL, {
          method: 'GET',
          timeout: 30000 // 30초 타임아웃
        });

        console.log(`[${new Date().toISOString()}] Gas price API response result:`, gasPriceResponse.result, 'info_cnt:', gasPriceResponse.info_cnt);

        if (!gasPriceResponse || gasPriceResponse.result !== 'success') {
          throw new Error(`Gas price info API returned error: ${JSON.stringify(gasPriceResponse)}`);
        }

        const gasPrices = gasPriceResponse.info || [];
        console.log(`[${new Date().toISOString()}] Fetched ${gasPrices.length} gas price records from price API.`);

        // 3. 주유소 기본 정보 처리 (bulk upsert)
        console.log(`[${new Date().toISOString()}] Processing ${gasStations.length} gas stations using bulk upsert...`);

        const gasStationDataList: gasStationDAO.GasStation[] = [];

        for (const stationInfo of gasStations) {
          try {
            // 좌표 파싱 (공백 제거)
            const katecX = stationInfo.gisxcoor ? parseFloat(stationInfo.gisxcoor.replace(/\s/g, '')) : undefined;
            const katecY = stationInfo.gisycoor ? parseFloat(stationInfo.gisycoor.replace(/\s/g, '')) : undefined;

            const gasStationData: gasStationDAO.GasStation = {
              opinet_id: stationInfo.id,
              station_name: stationInfo.osnm || '',
              brand_code: stationInfo.poll || '',
              gas_brand_code: stationInfo.gpoll || '',
              zip_code: stationInfo.zip || '',
              address: stationInfo.adr || '',
              phone: stationInfo.tel || '',
              station_type: stationInfo.lpgyn || 'N',
              katec_x: katecX,
              katec_y: katecY,
              api_raw_data: stationInfo
            };

            gasStationDataList.push(gasStationData);
          } catch (itemError: any) {
            console.error(`[${new Date().toISOString()}] Error processing gas station item:`, itemError.message);
            console.error(`[${new Date().toISOString()}] Station info:`, JSON.stringify(stationInfo, null, 2));
            // 개별 항목 오류는 전체 프로세스를 중단하지 않음
            continue;
          }
        }

        // Bulk upsert 실행
        if (gasStationDataList.length > 0) {
          const stationResult = await gasStationDAO.bulkUpsertGasStations(connection, gasStationDataList);
          newStationsCount = stationResult.newCount;
          updatedStationsCount = stationResult.updatedCount;
          processedStationsCount = gasStationDataList.length;

          console.log(`[${new Date().toISOString()}] Gas stations bulk upsert completed: ${newStationsCount} new, ${updatedStationsCount} updated, ${processedStationsCount} total processed`);
        }

        // 4. 주유소 가격 정보 처리 (bulk upsert)
        console.log(`[${new Date().toISOString()}] Processing ${gasPrices.length} gas prices using bulk upsert...`);

        const gasPriceDataList: gasStationDAO.GasPrice[] = [];

        for (const priceInfo of gasPrices) {
          try {
            const gasPriceData: gasStationDAO.GasPrice = {
              opinet_id: priceInfo.id,
              gasoline_price: parseInt(priceInfo.gasoline) || 0,
              premium_gasoline_price: parseInt(priceInfo.premium_gasoline) || 0,
              diesel_price: parseInt(priceInfo.diesel) || 0,
              lpg_price: parseInt(priceInfo.lpg) || 0,
              price_date: new Date(), // 현재 날짜로 설정
              api_raw_data: priceInfo
            };

            gasPriceDataList.push(gasPriceData);
          } catch (itemError: any) {
            console.error(`[${new Date().toISOString()}] Error processing gas price item:`, itemError.message);
            console.error(`[${new Date().toISOString()}] Price info:`, JSON.stringify(priceInfo, null, 2));
            // 개별 항목 오류는 전체 프로세스를 중단하지 않음
            continue;
          }
        }

        // Bulk upsert 실행
        if (gasPriceDataList.length > 0) {
          const priceResult = await gasStationDAO.bulkUpsertGasPrices(connection, gasPriceDataList);
          newPricesCount = priceResult.newCount;
          updatedPricesCount = priceResult.updatedCount;
          processedPricesCount = gasPriceDataList.length;

          console.log(`[${new Date().toISOString()}] Gas prices bulk upsert completed: ${newPricesCount} new, ${updatedPricesCount} updated, ${processedPricesCount} total processed`);
        }

        success = true;
        console.log(`[${new Date().toISOString()}] Successfully processed ${processedStationsCount} gas stations and ${processedPricesCount} price records.`);

      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Attempt ${attempt} failed:`, error.message);

        if (attempt > MAX_RETRIES) {
          // 최대 재시도 횟수 초과 시 에러 로그 기록
          await logDAO.createSystemErrorLog(connection, {
            error_timestamp: new Date(),
            error_code: 'GAS_STATION_FETCH_FAILED',
            message: `Failed to fetch ${SOURCE_NAME} data after ${MAX_RETRIES} attempts: ${error.message}`,
            details: error.stack,
            request_path: event.node.req.url || '',
            request_method: 'GET',
            resolved_status: false
          });
          throw error;
        }

        // 재시도 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 성공 로그 기록 (커밋 전에)
    console.log(`[${new Date().toISOString()}] Recording success log before commit...`);
    await logDAO.createApiFetchLog(connection, {
      source_name: SOURCE_NAME,
      fetch_timestamp: startTime,
      status: 'SUCCESS',
      retry_count: attempt - 1,
      processed_items: processedStationsCount + processedPricesCount,
      new_items: newStationsCount + newPricesCount,
      updated_items: updatedStationsCount + updatedPricesCount
    });

    console.log(`[${new Date().toISOString()}] Committing transaction...`);
    await connection.commit(); // 트랜잭션 커밋
    console.log(`[${new Date().toISOString()}] Transaction committed successfully.`);
    console.log(`[${new Date().toISOString()}] ${SOURCE_NAME} data fetch completed successfully.`);

    return {
      success: true,
      message: `Gas station data fetch completed successfully.`,
      stats: {
        stations: {
          processed: processedStationsCount,
          new: newStationsCount,
          updated: updatedStationsCount
        },
        prices: {
          processed: processedPricesCount,
          new: newPricesCount,
          updated: updatedPricesCount
        },
        attempts: attempt
      }
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ${SOURCE_NAME} data fetch failed:`, error.message);
    console.error(`[${new Date().toISOString()}] Error stack:`, error.stack);

    // 연결이 열려있는 경우에만 롤백 시도
    if (connection) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting to rollback transaction...`);
        // 연결 상태 확인 후 롤백
        if (connection.connection && !connection.connection.destroyed) {
          await connection.rollback();
          console.log(`[${new Date().toISOString()}] Transaction rolled back successfully.`);
        } else {
          console.log(`[${new Date().toISOString()}] Connection already closed, skipping rollback.`);
        }
      } catch (rollbackError: any) {
        console.error(`[${new Date().toISOString()}] Error during rollback:`, rollbackError.message);
        console.error(`[${new Date().toISOString()}] Rollback error stack:`, rollbackError.stack);
      }

      // 실패 로그 기록 (연결이 살아있는 경우에만)
      try {
        console.log(`[${new Date().toISOString()}] Attempting to record failure log...`);
        if (connection && connection.connection && !connection.connection.destroyed) {
          await logDAO.createApiFetchLog(connection, {
            source_name: SOURCE_NAME,
            fetch_timestamp: startTime,
            status: 'FAILURE',
            retry_count: attempt,
            processed_items: processedStationsCount + processedPricesCount,
            new_items: newStationsCount + newPricesCount,
            updated_items: updatedStationsCount + updatedPricesCount,
            error_message: error.message,
            error_details: error.stack
          });
          console.log(`[${new Date().toISOString()}] Failure log recorded successfully.`);
        } else {
          console.log(`[${new Date().toISOString()}] Connection not available for failure log recording.`);
        }
      } catch (logError: any) {
        console.error(`[${new Date().toISOString()}] Error creating failure log:`, logError.message);
        console.error(`[${new Date().toISOString()}] Failure log error stack:`, logError.stack);
      }
    }

    throw error;
  } finally {
    if (connection) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting to close database connection...`);
        // 연결이 열려있는 경우에만 종료
        if (connection.connection && !connection.connection.destroyed) {
          await connection.end();
          console.log(`[${new Date().toISOString()}] Database connection closed successfully.`);
        } else {
          console.log(`[${new Date().toISOString()}] Connection already closed or destroyed.`);
        }
      } catch (closeError: any) {
        console.error(`[${new Date().toISOString()}] Error closing connection:`, closeError.message);
        console.error(`[${new Date().toISOString()}] Close error stack:`, closeError.stack);
      }
    } else {
      console.log(`[${new Date().toISOString()}] No connection to close.`);
    }
  }
});

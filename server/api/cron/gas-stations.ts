// server/api/cron/gas-stations.ts
import { defineEventHandler } from 'h3';


import { gasStationDAO, logDAO } from '~/server/dao/supabase';

const MAX_RETRIES = 2; // 최대 재시도 횟수
const SOURCE_NAME = 'gas_stations'; // 데이터 소스명
const API_KEY = '860665'; // 제주도 API 키
const GAS_INFO_API_URL = `http://api.jejuits.go.kr/api/infoGasInfoList?code=${API_KEY}`;
const GAS_PRICE_API_URL = `http://api.jejuits.go.kr/api/infoGasPriceList?code=${API_KEY}`;

export default defineEventHandler(async (event) => {
  // TODO: Supabase로 마이그레이션 후 이 cron job을 다시 구현해야 합니다.
  console.log(`[${new Date().toISOString()}] Gas station cron job is temporarily disabled during Supabase migration.`);

  return {
    success: false,
    message: 'Gas station cron job is temporarily disabled during Supabase migration.',
    note: 'This will be re-implemented with Supabase DAO after migration is complete.'
  };
});

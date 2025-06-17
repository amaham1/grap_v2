// server/dao/supabase/index.ts
// Supabase DAO 모듈을 내보내는 인덱스 파일

import * as festivalDAO from './festival-dao'
import * as festivalImageDAO from './festival-image-dao'
import * as exhibitionDAO from './exhibition-dao'
import * as welfareServiceDAO from './welfare-service-dao'
import * as gasStationDAO from './gas-station-dao'
import * as logDAO from './log-dao'

export {
  festivalDAO,
  festivalImageDAO,
  exhibitionDAO,
  welfareServiceDAO,
  gasStationDAO,
  logDAO
}

// 타입 재내보내기
export type { Festival } from './festival-dao'
export type { FestivalImage } from '~/server/types/image'
export type { Exhibition } from './exhibition-dao'
export type { WelfareService } from './welfare-service-dao'
export type { GasStation, GasPrice } from './gas-station-dao'
export type { ApiLog, ApiFetchLog, SystemErrorLog } from './log-dao'

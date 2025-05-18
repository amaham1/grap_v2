// server/dao/index.ts
// DAO 모듈을 내보내는 인덱스 파일

import * as festivalDAO from './festival-dao';
import * as exhibitionDAO from './exhibition-dao';
import * as welfareServiceDAO from './welfare-service-dao';
import * as logDAO from './log-dao';

export {
  festivalDAO,
  exhibitionDAO,
  welfareServiceDAO,
  logDAO
};

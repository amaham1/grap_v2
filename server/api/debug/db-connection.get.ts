// server/api/debug/db-connection.get.ts
import { defineEventHandler } from 'h3';
import { testDatabaseConnection } from '~/server/utils/mysql';

export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG] DB 연결 확인 API 호출됨');
    
    const result = await testDatabaseConnection();
    
    return {
      success: result.success,
      message: result.message,
      details: result.details,
      config: result.config,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[DEBUG] DB 연결 확인 실패:', error);
    
    return {
      success: false,
      message: 'DB 연결 확인 중 오류 발생',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

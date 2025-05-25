import { defineEventHandler } from 'h3';
import { testDatabaseConnection } from '~/server/utils/mysql';

export default defineEventHandler(async (event) => {
  try {
    const connectionTest = await testDatabaseConnection();
    
    // 콘솔에도 로그 출력
    console.log('[DB 연결 테스트]', connectionTest);
    
    return {
      timestamp: new Date().toISOString(),
      ...connectionTest
    };
  } catch (error) {
    console.error('[DB 연결 테스트 오류]', error);
    
    return {
      timestamp: new Date().toISOString(),
      success: false,
      message: 'DB 연결 테스트 중 오류 발생',
      details: error.message,
      config: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_DATABASE || 'mydatabase',
      }
    };
  }
});

// server/api/admin/cache-invalidate.post.ts
import { defineEventHandler, createError } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    // 관리자 권한 확인 (간단한 헤더 체크)
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader || !authHeader.includes('admin-cache-clear')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // 캐시 무효화를 위한 응답 헤더 설정
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate');
    setHeader(event, 'Pragma', 'no-cache');
    setHeader(event, 'Expires', '0');
    
    // 클라우드플레어 캐시 무효화 헤더
    setHeader(event, 'CF-Cache-Status', 'BYPASS');

    return {
      success: true,
      message: 'Cache invalidation headers set',
      timestamp: new Date().toISOString(),
      actions: [
        'Set Cache-Control: no-cache, no-store, must-revalidate',
        'Set Pragma: no-cache',
        'Set Expires: 0',
        'Set CF-Cache-Status: BYPASS'
      ]
    };

  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to invalidate cache'
    });
  }
});

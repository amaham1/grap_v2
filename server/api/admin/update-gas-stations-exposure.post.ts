// server/api/admin/update-gas-stations-exposure.post.ts
import { defineEventHandler } from 'h3';
import { executeQuery } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  try {
    console.log('[UPDATE] 주유소 노출 상태 업데이트 시작');

    // 모든 주유소의 is_exposed를 true로 업데이트
    const updateQuery = 'UPDATE gas_stations SET is_exposed = true WHERE is_exposed = false';
    const result = await executeQuery(updateQuery, []);
    
    console.log('[UPDATE] 업데이트 완료:', result);

    // 업데이트된 개수 확인
    const countQuery = 'SELECT COUNT(*) as total FROM gas_stations WHERE is_exposed = true';
    const countResult = await executeQuery<any[]>(countQuery, []);
    
    const totalExposed = countResult[0].total;
    console.log(`[UPDATE] 현재 노출 상태인 주유소 수: ${totalExposed}개`);

    return {
      success: true,
      message: `주유소 노출 상태 업데이트 완료`,
      totalExposed: totalExposed,
      updatedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('[ERROR] 주유소 노출 상태 업데이트 실패:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `주유소 노출 상태 업데이트 실패: ${error.message}`
    });
  }
});

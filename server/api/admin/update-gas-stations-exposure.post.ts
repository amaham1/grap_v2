// server/api/admin/update-gas-stations-exposure.post.ts
import { defineEventHandler } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';


export default defineEventHandler(async (event) => {
  try {
    console.log('[UPDATE] 주유소 노출 상태 업데이트 시작');

    // Supabase DAO를 사용하여 모든 주유소의 is_exposed를 true로 업데이트
    const result = await gasStationDAO.updateAllGasStationsExposure(true);

    console.log('[UPDATE] 업데이트 완료:', result);

    // 업데이트된 개수 확인
    const totalExposed = await gasStationDAO.getGasStationsCount({ isExposed: 'true' });

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

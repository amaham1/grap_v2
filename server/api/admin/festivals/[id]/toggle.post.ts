import { defineEventHandler, getRouterParams, setResponseStatus } from 'h3';
import { festivalDAO } from '~/server/utils/dao/festival-dao';

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event);
  const id = params.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '축제 ID가 필요합니다.'
    });
  }

  try {
    const festival = await festivalDAO.getFestivalById(id);
    if (!festival) {
      throw createError({
        statusCode: 404,
        statusMessage: '해당 ID의 축제를 찾을 수 없습니다.'
      });
    }

    const success = await festivalDAO.toggleFestivalVisibility(id, festival.is_show);
    if (success) {
      return { success: true, message: '축제 노출 상태가 변경되었습니다.', newIsShow: !festival.is_show };
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: '축제 노출 상태 변경에 실패했습니다.'
      });
    }
  } catch (error: any) {
    console.error(`API Error POST /api/admin/festivals/${id}/toggle:`, error);
    // 이미 createError로 감싸진 오류가 아니라면 새로 생성합니다.
    if (error.statusCode) throw error; 
    throw createError({
      statusCode: 500,
      statusMessage: '축제 노출 상태 변경 중 오류가 발생했습니다.',
      data: { originalError: error.message }
    });
  }
});

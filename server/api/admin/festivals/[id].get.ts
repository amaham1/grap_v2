import { defineEventHandler, getRouterParam, createError } from 'h3';
import { festivalDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  try {
    // URL 파라미터에서 ID 추출
    const festivalId = getRouterParam(event, 'id');
    
    if (!festivalId) {
      throw createError({
        statusCode: 400,
        statusMessage: '축제 ID가 필요합니다.'
      });
    }
    
    // ID 유효성 검사
    const id = parseInt(festivalId, 10);
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바른 축제 ID가 아닙니다.'
      });
    }
    
    // 축제 정보 조회
    const festival = await festivalDAO.getFestivalById(id);
    
    if (!festival) {
      throw createError({
        statusCode: 404,
        statusMessage: '축제를 찾을 수 없습니다.'
      });
    }
    
    console.log(`[축제 상세 조회] ID: ${id}, 제목: ${festival.title}`);
    
    return {
      statusCode: 200,
      statusMessage: 'Success',
      data: festival
    };
    
  } catch (error: any) {
    console.error('[축제 상세 조회 API 오류]', error);
    
    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }
    
    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '축제 정보 조회 중 서버 오류가 발생했습니다.'
    });
  }
});

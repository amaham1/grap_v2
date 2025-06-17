// server/api/admin/festivals/[id]/images.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getFestivalImages } from '~/server/dao/supabase/festival-image-dao';
import { getFestivalById } from '~/server/dao/supabase/festival-dao';
import type { ImageListResponse } from '~/server/types/image';

export default defineEventHandler(async (event): Promise<ImageListResponse> => {
  try {
    // 라우트 파라미터에서 축제 ID 가져오기
    const festivalIdParam = getRouterParam(event, 'id');
    
    if (!festivalIdParam) {
      throw createError({
        statusCode: 400,
        statusMessage: '축제 ID가 필요합니다.'
      });
    }

    const festivalId = parseInt(festivalIdParam);
    
    if (isNaN(festivalId)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바른 축제 ID가 아닙니다.'
      });
    }

    // 축제 존재 여부 확인
    const festival = await getFestivalById(festivalId);
    if (!festival) {
      throw createError({
        statusCode: 404,
        statusMessage: '존재하지 않는 축제입니다.'
      });
    }

    // 축제의 모든 이미지 조회 (업로드된 이미지만)
    const result = await getFestivalImages(festivalId, false);

    if (result.error) {
      console.error('이미지 목록 조회 오류:', result.error);

      // 테이블이 존재하지 않는 경우 빈 배열 반환
      if (result.error.code === 'PGRST116' || result.error.message?.includes('does not exist')) {
        console.log('festival_images 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
        return {
          success: true,
          data: [],
          total: 0,
          message: 'festival_images 테이블이 아직 생성되지 않았습니다.'
        };
      }

      throw createError({
        statusCode: 500,
        statusMessage: '이미지 목록을 불러오는 중 오류가 발생했습니다.'
      });
    }

    return {
      success: true,
      data: result.data || [],
      total: result.data?.length || 0,
      message: '이미지 목록을 성공적으로 조회했습니다.'
    };

  } catch (error: any) {
    console.error('이미지 목록 조회 API 오류:', error);

    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }

    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '이미지 목록 조회 중 서버 오류가 발생했습니다.'
    });
  }
});

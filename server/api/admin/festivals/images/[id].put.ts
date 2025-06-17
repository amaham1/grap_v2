// server/api/admin/festivals/images/[id].put.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { 
  getFestivalImageById, 
  updateFestivalImage, 
  setFestivalThumbnail 
} from '~/server/dao/supabase/festival-image-dao';
import type { ImageUpdateRequest } from '~/server/types/image';

export default defineEventHandler(async (event) => {
  try {
    // 라우트 파라미터에서 이미지 ID 가져오기
    const imageIdParam = getRouterParam(event, 'id');
    
    if (!imageIdParam) {
      throw createError({
        statusCode: 400,
        statusMessage: '이미지 ID가 필요합니다.'
      });
    }

    const imageId = parseInt(imageIdParam);
    
    if (isNaN(imageId)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바른 이미지 ID가 아닙니다.'
      });
    }

    // 요청 본문 읽기
    const body = await readBody(event) as Partial<ImageUpdateRequest>;

    // 이미지 존재 여부 확인
    const existingImage = await getFestivalImageById(imageId);
    if (!existingImage) {
      throw createError({
        statusCode: 404,
        statusMessage: '존재하지 않는 이미지입니다.'
      });
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof existingImage> = {};

    if (body.alt_text !== undefined) {
      updateData.alt_text = body.alt_text.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description.trim();
    }

    if (body.display_order !== undefined) {
      if (body.display_order < 0) {
        throw createError({
          statusCode: 400,
          statusMessage: '표시 순서는 0 이상이어야 합니다.'
        });
      }
      updateData.display_order = body.display_order;
    }

    // 썸네일 설정 처리 (별도 함수 사용)
    if (body.is_thumbnail !== undefined) {
      if (body.is_thumbnail) {
        // 썸네일로 설정 (기존 썸네일 자동 해제)
        const thumbnailResult = await setFestivalThumbnail(existingImage.festival_id, imageId);
        
        if (thumbnailResult.error) {
          throw createError({
            statusCode: 500,
            statusMessage: '썸네일 설정에 실패했습니다.'
          });
        }
      } else {
        // 썸네일 해제
        updateData.is_thumbnail = false;
      }
    }

    // 일반 필드 업데이트 (썸네일 설정이 아닌 경우)
    if (Object.keys(updateData).length > 0) {
      const result = await updateFestivalImage(imageId, updateData);

      if (result.error) {
        console.error('이미지 업데이트 오류:', result.error);
        throw createError({
          statusCode: 500,
          statusMessage: '이미지 정보 업데이트에 실패했습니다.'
        });
      }
    }

    // 업데이트된 이미지 정보 조회
    const updatedImage = await getFestivalImageById(imageId);

    return {
      success: true,
      message: '이미지 정보가 성공적으로 업데이트되었습니다.',
      data: updatedImage
    };

  } catch (error: any) {
    console.error('이미지 업데이트 API 오류:', error);

    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }

    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '이미지 업데이트 중 서버 오류가 발생했습니다.'
    });
  }
});

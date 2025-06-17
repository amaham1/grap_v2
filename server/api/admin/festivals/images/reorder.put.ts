// server/api/admin/festivals/images/reorder.put.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { updateImageOrders, getFestivalImageById } from '~/server/dao/supabase/festival-image-dao';

interface ReorderRequest {
  updates: Array<{
    id: number;
    display_order: number;
  }>;
}

export default defineEventHandler(async (event) => {
  try {
    // 요청 본문 읽기
    const body = await readBody(event) as ReorderRequest;

    if (!body.updates || !Array.isArray(body.updates)) {
      throw createError({
        statusCode: 400,
        statusMessage: '업데이트할 이미지 순서 정보가 필요합니다.'
      });
    }

    if (body.updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '업데이트할 이미지가 없습니다.'
      });
    }

    // 유효성 검사
    for (const update of body.updates) {
      if (!update.id || typeof update.id !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: '올바른 이미지 ID가 필요합니다.'
        });
      }

      if (typeof update.display_order !== 'number' || update.display_order < 0) {
        throw createError({
          statusCode: 400,
          statusMessage: '표시 순서는 0 이상의 숫자여야 합니다.'
        });
      }

      // 이미지 존재 여부 확인
      const existingImage = await getFestivalImageById(update.id);
      if (!existingImage) {
        throw createError({
          statusCode: 404,
          statusMessage: `이미지 ID ${update.id}가 존재하지 않습니다.`
        });
      }

      if (existingImage.upload_status !== 'uploaded') {
        throw createError({
          statusCode: 400,
          statusMessage: `이미지 ID ${update.id}는 업로드된 상태가 아닙니다.`
        });
      }
    }

    // 중복된 ID 확인
    const ids = body.updates.map(u => u.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      throw createError({
        statusCode: 400,
        statusMessage: '중복된 이미지 ID가 있습니다.'
      });
    }

    // 일괄 순서 업데이트 실행
    const success = await updateImageOrders(body.updates);

    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: '이미지 순서 업데이트에 실패했습니다.'
      });
    }

    return {
      success: true,
      message: '이미지 순서가 성공적으로 업데이트되었습니다.',
      data: {
        updated_count: body.updates.length,
        updates: body.updates
      }
    };

  } catch (error: any) {
    console.error('이미지 순서 업데이트 API 오류:', error);

    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }

    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '이미지 순서 업데이트 중 서버 오류가 발생했습니다.'
    });
  }
});

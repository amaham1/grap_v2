// server/api/admin/festivals/images/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3';
import { 
  getFestivalImageById, 
  deleteFestivalImage, 
  hardDeleteFestivalImage 
} from '~/server/dao/supabase/festival-image-dao';
import { deleteFromR2 } from '~/server/utils/r2-upload';

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

    // 이미지 존재 여부 확인
    const existingImage = await getFestivalImageById(imageId);
    if (!existingImage) {
      throw createError({
        statusCode: 404,
        statusMessage: '존재하지 않는 이미지입니다.'
      });
    }

    // 이미 삭제된 이미지인지 확인
    if (existingImage.upload_status === 'deleted') {
      throw createError({
        statusCode: 400,
        statusMessage: '이미 삭제된 이미지입니다.'
      });
    }

    // 쿼리 파라미터에서 하드 삭제 여부 확인
    const url = new URL(event.node.req.url!, `http://${event.node.req.headers.host}`);
    const hardDelete = url.searchParams.get('hard') === 'true';

    if (hardDelete) {
      // 하드 삭제: R2에서 파일 삭제 후 DB에서 완전 삭제
      try {
        // R2에서 파일 삭제
        const r2DeleteSuccess = await deleteFromR2(existingImage.file_path);
        
        if (!r2DeleteSuccess) {
          console.warn(`R2 파일 삭제 실패: ${existingImage.file_path}`);
          // R2 삭제 실패해도 DB에서는 삭제 진행
        }

        // DB에서 완전 삭제
        const dbResult = await hardDeleteFestivalImage(imageId);

        if (dbResult.error) {
          throw createError({
            statusCode: 500,
            statusMessage: '이미지 삭제에 실패했습니다.'
          });
        }

        return {
          success: true,
          message: '이미지가 완전히 삭제되었습니다.',
          data: {
            id: imageId,
            deleted_type: 'hard',
            r2_deleted: r2DeleteSuccess
          }
        };

      } catch (error: any) {
        console.error('하드 삭제 오류:', error);
        throw createError({
          statusCode: 500,
          statusMessage: '이미지 삭제 중 오류가 발생했습니다.'
        });
      }

    } else {
      // 소프트 삭제: DB에서만 상태 변경
      const result = await deleteFestivalImage(imageId);

      if (result.error) {
        console.error('이미지 소프트 삭제 오류:', result.error);
        throw createError({
          statusCode: 500,
          statusMessage: '이미지 삭제에 실패했습니다.'
        });
      }

      return {
        success: true,
        message: '이미지가 삭제되었습니다.',
        data: {
          id: imageId,
          deleted_type: 'soft',
          note: '파일은 보관되며, 필요시 복구할 수 있습니다.'
        }
      };
    }

  } catch (error: any) {
    console.error('이미지 삭제 API 오류:', error);

    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }

    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '이미지 삭제 중 서버 오류가 발생했습니다.'
    });
  }
});

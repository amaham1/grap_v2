// server/api/public/festivals/[id]/images.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getFestivalImages } from '~/server/dao/supabase/festival-image-dao';
import { getPublicFestivalById } from '~/server/dao/supabase/festival-dao';

export default defineEventHandler(async (event) => {
  try {
    // URL 파라미터에서 축제 ID 추출
    const festivalId = parseInt(getRouterParam(event, 'id') as string);

    if (isNaN(festivalId) || festivalId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '유효하지 않은 축제 ID입니다.'
      });
    }

    // 축제 존재 여부 및 공개 상태 확인
    const festival = await getPublicFestivalById(festivalId);
    if (!festival) {
      throw createError({
        statusCode: 404,
        statusMessage: '존재하지 않거나 공개되지 않은 축제입니다.'
      });
    }

    // 축제 이미지 목록 조회 (썸네일 우선, 표시 순서대로)
    const result = await getFestivalImages(festivalId, false);

    if (result.error) {
      console.error('축제 이미지 조회 오류:', result.error);
      throw createError({
        statusCode: 500,
        statusMessage: '이미지 정보를 불러오는 중 오류가 발생했습니다.'
      });
    }

    const images = result.data || [];

    // 썸네일을 맨 앞으로 정렬
    const sortedImages = images.sort((a, b) => {
      // 썸네일이 있으면 맨 앞으로
      if (a.is_thumbnail && !b.is_thumbnail) return -1;
      if (!a.is_thumbnail && b.is_thumbnail) return 1;

      // 둘 다 썸네일이거나 둘 다 일반 이미지면 display_order로 정렬
      return a.display_order - b.display_order;
    });

    // 공개용 이미지 정보만 반환
    const publicImages = sortedImages.map(image => ({
      id: image.id,
      file_url: image.file_url,
      alt_text: image.alt_text || '',
      description: image.description || '',
      width: image.width,
      height: image.height,
      is_thumbnail: image.is_thumbnail,
      display_order: image.display_order
    }));

    return {
      success: true,
      data: {
        festival_id: festivalId,
        images: publicImages,
        total_count: publicImages.length
      }
    };

  } catch (error: any) {
    console.error('축제 이미지 조회 API 오류:', error);

    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }

    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '이미지 정보 조회 중 서버 오류가 발생했습니다.'
    });
  }
});

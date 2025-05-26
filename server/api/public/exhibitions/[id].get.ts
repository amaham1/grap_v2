// server/api/public/exhibitions/[id].get.ts
import { defineEventHandler, createError } from 'h3';
import { exhibitionDAO } from '~/server/dao/supabase';
import { sanitizeObjectHtmlFields } from '~/server/utils/sanitize';

interface ExhibitionDetail {
  id: number;
  title: string;
  category_name: string;
  cover_image_url: string;
  start_date: Date;
  end_date: Date;
  time_info: string;
  pay_info: string;
  location_name: string;
  organizer_info: string;
  tel_number: string;
  status_info: string;
  division_name: string;
  fetched_at: Date;
}

export default defineEventHandler(async (event) => {
  try {
    // URL 파라미터에서 ID 추출
    const id = parseInt(event.context.params?.id as string);

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: '유효하지 않은 공연/전시 ID입니다.'
      });
    }

    // Supabase DAO를 사용하여 공개 전시/공연 상세 정보 조회
    const result = await exhibitionDAO.getPublicExhibitionById(id);

    if (!result) {
      throw createError({
        statusCode: 404,
        message: '요청하신 공연/전시를 찾을 수 없습니다.'
      });
    }

    // 응답 반환
    return {
      item: result
    };
  } catch (error: any) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      throw error; // 이미 생성된 오류는 그대로 반환
    }


    throw createError({
      statusCode: 500,
      message: '공연/전시 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
});

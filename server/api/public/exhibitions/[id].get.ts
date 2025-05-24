// server/api/public/exhibitions/[id].get.ts
import { defineEventHandler, createError } from 'h3';
import { executeQuery } from '~/server/utils/db';
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
    
    // 상세 정보 조회 (임시로 노출 상태 필터(is_exposed=true) 제거하고 모든 데이터 표시함)
    const query = `
      SELECT 
        id, title, category_name, cover_image_url, start_date, end_date, 
        time_info, pay_info, location_name, organizer_info, tel_number, 
        status_info, division_name, fetched_at
      FROM exhibitions
      WHERE id = ?
      LIMIT 1`;
    
    const results = await executeQuery<ExhibitionDetail[]>(query, [id]);
    
    if (!results || results.length === 0) {
      throw createError({
        statusCode: 404,
        message: '요청하신 공연/전시를 찾을 수 없습니다.'
      });
    }
    
    // 응답 반환
    return {
      item: results[0]
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

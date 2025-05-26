// server/api/public/exhibitions/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { exhibitionDAO } from '~/server/dao/supabase';
import { sanitizeItemsHtmlFields } from '~/server/utils/sanitize';

interface ExhibitionPublic {
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
    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const search = query.search as string || '';
    const category = query.category as string || '';

    if (!['ASC', 'DESC'].includes((query.sortOrder as string || 'desc').toUpperCase())) {
      throw createError({
        statusCode: 400,
        message: '정렬 순서는 asc 또는 desc만 가능합니다.'
      });
    }

    // Supabase DAO를 사용하여 공개 전시/공연 목록 조회
    const result = await exhibitionDAO.getPublicExhibitions({
      page,
      limit: pageSize,
      searchTerm: search,
      categoryName: category
    });

    if (result.error) {
      console.error('[공개 API 오류] 공연/전시 목록 조회 실패:', result.error);
      throw createError({
        statusCode: 500,
        message: '공연/전시 목록을 불러오는 중 오류가 발생했습니다.'
      });
    }

    // 응답 반환
    return {
      items: result.data || [],
      pagination: {
        page,
        pageSize,
        total: result.count || 0,
        pageCount: Math.ceil((result.count || 0) / pageSize)
      }
    };
  } catch (error: any) {
    if (error.statusCode === 400) {
      throw error; // 이미 생성된 오류는 그대로 반환
    }

    console.error('[공개 API 오류] 공연/전시 목록 조회 실패:', error.message);

    throw createError({
      statusCode: 500,
      message: '공연/전시 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

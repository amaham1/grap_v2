// server/api/public/festivals/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { festivalDAO } from '~/server/dao/supabase';
import { sanitizeItemsHtmlFields } from '~/server/utils/sanitize';

interface FestivalPublic {
  id: number;
  title: string;
  content_html: string;
  source_url: string;
  writer_name: string;
  written_date: Date;
  files_info: any;
  fetched_at: Date;
}

export default defineEventHandler(async (event) => {
  try {
    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const search = query.search as string || '';

    // Supabase DAO를 사용하여 공개 축제 목록 조회
    const result = await festivalDAO.getPublicFestivals({
      page,
      limit: pageSize,
      searchTerm: search
    });

    if (result.error) {
      console.error('[공개 API 오류] 축제/행사 목록 조회 실패:', result.error);
      throw createError({
        statusCode: 500,
        message: '축제/행사 목록을 불러오는 중 오류가 발생했습니다.'
      });
    }

    const items = result.data || [];

    // HTML 필드 새니타이징 및 files_info 처리
    const sanitizedItems = sanitizeItemsHtmlFields(items, ['content_html']).map(item => {
      let filesInfo;
      try {
        // JSON 문자열이면 파싱, 이미 객체면 그대로 사용
        filesInfo = typeof item.files_info === 'string' ?
          JSON.parse(item.files_info) : item.files_info;
      } catch (e) {
        filesInfo = [];
      }

      return {
        ...item,
        files_info: filesInfo
      };
    });

    // 총 개수 조회
    const total = result.count || items.length;

    // 응답 반환
    return {
      items: sanitizedItems,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize)
      }
    };
  } catch (error: any) {
    if (error.statusCode === 400) {
      throw error; // 이미 생성된 오류는 그대로 반환
    }

    console.error('[공개 API 오류] 축제/행사 목록 조회 실패:', error.message);

    throw createError({
      statusCode: 500,
      message: '축제/행사 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

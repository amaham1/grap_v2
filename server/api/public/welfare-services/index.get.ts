// server/api/public/welfare-services/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { welfareServiceDAO } from '~/server/dao/supabase';
import { sanitizeItemsHtmlFields } from '~/server/utils/sanitize';

interface WelfareServicePublic {
  id: number;
  service_name: string;
  is_all_location: boolean;
  is_jeju_location: boolean;
  is_seogwipo_location: boolean;
  support_target_html: string;
  support_content_html: string;
  application_info_html: string;
  fetched_at: Date;
}

export default defineEventHandler(async (event) => {
  try {
    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const search = query.search as string || '';
    const location = query.location as string || '';

    // Supabase DAO를 사용하여 공개 복지 서비스 목록 조회
    const result = await welfareServiceDAO.getPublicWelfareServices({
      page,
      limit: pageSize,
      searchTerm: search,
      location: location as any
    });

    if (result.error) {
      console.error('[공개 API 오류] 복지 서비스 목록 조회 실패:', result.error);
      throw createError({
        statusCode: 500,
        message: '복지 서비스 목록을 불러오는 중 오류가 발생했습니다.'
      });
    }

    // HTML 필드 새니타이징
    const sanitizedItems = sanitizeItemsHtmlFields(result.data || [], [
      'support_target_html',
      'support_content_html',
      'application_info_html'
    ]);

    // 응답 반환
    return {
      items: sanitizedItems,
      pagination: {
        page,
        pageSize,
        total: result.count || 0,
        pageCount: Math.ceil((result.count || 0) / pageSize)
      }
    };
  } catch (error: any) {
    console.error('[공개 API 오류] 복지 서비스 목록 조회 실패:', error.message);

    throw createError({
      statusCode: 500,
      message: '복지 서비스 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

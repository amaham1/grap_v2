import { defineEventHandler, getQuery, setResponseStatus } from 'h3';
import { festivalDAO } from '~/server/dao/supabase';

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event);

  const page = parseInt(queryParams.page as string) || 1;
  const limit = parseInt(queryParams.limit as string) || 10;
  const searchTerm = queryParams.searchQuery as string || '';
  const isExposed = queryParams.filterStatus as 'true' | 'false' | '' || '';

  try {
    const result = await festivalDAO.getFestivals({
      page,
      limit,
      searchTerm,
      isExposed,
    });
    const total = await festivalDAO.getFestivalsCount({
      searchTerm,
      isExposed,
    });
    return {
      success: true,
      data: result.data || [],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  } catch (error: any) {
    console.error('API Error GET /api/admin/festivals:', error);
    // Nuxt 3에서는 createError 유틸리티를 사용하여 오류를 반환하는 것이 일반적입니다.
    throw createError({
      statusCode: 500,
      statusMessage: '축제 목록을 가져오는 중 오류가 발생했습니다.',
      data: { originalError: error.message } // 선택적으로 원래 오류 메시지를 포함할 수 있습니다.
    });
  }
});

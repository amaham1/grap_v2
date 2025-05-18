import { defineEventHandler, getQuery, setResponseStatus } from 'h3';
import { getWelfareServices, GetWelfareServicesOptions } from '~/server/utils/dao/welfare-service-dao';

export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event);
    const options: GetWelfareServicesOptions = {
      page: queryParams.page ? parseInt(String(queryParams.page), 10) : 1,
      limit: queryParams.limit ? parseInt(String(queryParams.limit), 10) : 10,
      searchTerm: queryParams.searchTerm ? String(queryParams.searchTerm) : undefined,
      isExposed: queryParams.isExposed ? String(queryParams.isExposed) : undefined,
      categoryName: queryParams.categoryName ? String(queryParams.categoryName) : undefined,
    };

    const result = await getWelfareServices(options);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  } catch (error: any) {
    console.error('Error fetching welfare services:', error);
    setResponseStatus(event, error.statusCode || 500);
    return {
      success: false,
      message: error.message || '복지서비스 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.toString(),
    };
  }
});

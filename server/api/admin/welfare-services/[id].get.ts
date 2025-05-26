import { defineEventHandler, setResponseStatus } from 'h3';
import { getWelfareServiceById } from '~/server/dao/supabase/welfare-service-dao';

export default defineEventHandler(async (event) => {
  try {
    const welfareServiceId = event.context.params?.id;
    if (!welfareServiceId || isNaN(parseInt(welfareServiceId, 10))) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: '유효하지 않은 복지서비스 ID 입니다.',
      };
    }

    const idAsNumber = parseInt(welfareServiceId, 10);
    const welfareService = await getWelfareServiceById(idAsNumber);

    if (!welfareService) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: '해당 ID의 복지서비스를 찾을 수 없습니다.',
      };
    }

    return {
      success: true,
      data: welfareService,
    };
  } catch (error: any) {
    console.error(`Error fetching welfare service with ID ${event.context.params?.id}:`, error);
    setResponseStatus(event, error.statusCode || 500);
    return {
      success: false,
      message: error.message || '복지서비스 정보를 불러오는 중 오류가 발생했습니다.',
      error: error.toString(),
    };
  }
});

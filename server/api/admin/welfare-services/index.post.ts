import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { upsertWelfareService, getWelfareServiceById, WelfareService } from '~/server/dao/supabase/welfare-service-dao';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Partial<WelfareService>>(event);

    // Basic validation (can be expanded)
    if (!body.service_name) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: '서비스명은 필수 항목입니다.',
      };
    }

    const result = await upsertWelfareService(body as WelfareService);
    const newWelfareService = result.data?.[0] || null;

    setResponseStatus(event, 201); // Created
    return {
      success: true,
      message: '복지서비스가 성공적으로 생성되었습니다.',
      data: newWelfareService,
    };
  } catch (error: any) {
    console.error('Error creating welfare service:', error);
    setResponseStatus(event, error.statusCode || 500);
    return {
      success: false,
      message: error.message || '복지서비스 생성 중 오류가 발생했습니다.',
      error: error.toString(),
    };
  }
});



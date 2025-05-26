import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { updateWelfareService, getWelfareServiceById, WelfareService } from '~/server/dao/supabase/welfare-service-dao';

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

    const body = await readBody<Partial<WelfareService>>(event);

    // Prevent changing id, created_at via PUT; original_api_id, fetched_at might be allowed depending on policy
    delete body.id;
    delete body.created_at;
    // delete body.original_api_id; // Example: if original_api_id should not be changed by admin
    // delete body.fetched_at; // Example: if fetched_at should not be changed by admin

    if (Object.keys(body).length === 0) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: '수정할 내용이 없습니다.',
      };
    }

    const result = await updateWelfareService(idAsNumber, body);

    if (!result || !result.data) {
      // This might happen if the record to update wasn't found, or no rows were affected.
      // Check if the item actually exists first.
      const existingService = await getWelfareServiceById(idAsNumber);
      if (!existingService) {
        setResponseStatus(event, 404);
        return {
          success: false,
          message: '해당 ID의 복지서비스를 찾을 수 없어 업데이트할 수 없습니다.',
        };
      }
      // If it exists but update failed for other reasons (e.g. no actual change resulting in 0 affectedRows)
      // Consider this a success if data is unchanged, or an error if an update was expected.
      // For simplicity here, if updateWelfareService returns false and item exists, we assume no change needed or an issue.
      setResponseStatus(event, 500); // Or a more specific error like 304 Not Modified if applicable
      return {
        success: false,
        message: '복지서비스 정보 업데이트에 실패했습니다. (데이터 변경 없음 또는 오류)',
      };
    }

    const updatedWelfareService = await getWelfareServiceById(idAsNumber);

    return {
      success: true,
      message: '복지서비스 정보가 성공적으로 업데이트되었습니다.',
      data: updatedWelfareService,
    };
  } catch (error: any) {
    console.error(`Error updating welfare service with ID ${event.context.params?.id}:`, error);
    setResponseStatus(event, error.statusCode || 500);
    return {
      success: false,
      message: error.message || '복지서비스 정보 업데이트 중 오류가 발생했습니다.',
      error: error.toString(),
    };
  }
});

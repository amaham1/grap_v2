import { defineEventHandler, setResponseStatus } from 'h3';
import { deleteWelfareService, getWelfareServiceById } from '~/server/utils/dao/welfare-service-dao';

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

    // Optional: Check if the service exists before attempting to delete
    const existingService = await getWelfareServiceById(idAsNumber);
    if (!existingService) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: '삭제하려는 복지서비스를 찾을 수 없습니다.',
      };
    }

    const result = await deleteWelfareService(idAsNumber);

    if (result.affectedRows === 0) {
      // This case should ideally be caught by the check above, but as a fallback:
      setResponseStatus(event, 404); 
      return {
        success: false,
        message: '복지서비스 삭제에 실패했거나 해당 서비스가 존재하지 않습니다.',
      };
    }

    setResponseStatus(event, 200); // Or 204 No Content if not returning a message body
    return {
      success: true,
      message: '복지서비스가 성공적으로 삭제되었습니다.',
    };
  } catch (error: any) {
    console.error(`Error deleting welfare service with ID ${event.context.params?.id}:`, error);
    setResponseStatus(event, error.statusCode || 500);
    return {
      success: false,
      message: error.message || '복지서비스 삭제 중 오류가 발생했습니다.',
      error: error.toString(),
    };
  }
});

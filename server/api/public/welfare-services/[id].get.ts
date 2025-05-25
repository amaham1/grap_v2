// server/api/public/welfare-services/[id].get.ts
import { defineEventHandler, createError } from 'h3';
import { executeQuery } from '~/server/utils/db';
import { sanitizeObjectHtmlFields } from '~/server/utils/sanitize';

interface WelfareServiceDetail {
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
    // URL 파라미터에서 ID 추출
    const id = parseInt(event.context.params?.id as string);

    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: '유효하지 않은 복지 서비스 ID입니다.'
      });
    }

    // 상세 정보 조회 (노출 상태가 활성화된 항목만)
    const query = `
      SELECT
        id, service_name, is_all_location, is_jeju_location, is_seogwipo_location,
        support_target_html, support_content_html, application_info_html, fetched_at
      FROM welfare_services
      WHERE id = ? AND is_exposed = ?
      LIMIT 1`;

    const results = await executeQuery<WelfareServiceDetail[]>(query, [id, true]);

    if (!results || results.length === 0) {
      throw createError({
        statusCode: 404,
        message: '요청하신 복지 서비스를 찾을 수 없습니다.'
      });
    }

    // HTML 필드 새니타이징
    const sanitizedItem = sanitizeObjectHtmlFields(results[0], [
      'support_target_html',
      'support_content_html',
      'application_info_html'
    ]);

    // 응답 반환
    return {
      item: sanitizedItem
    };
  } catch (error: any) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      throw error; // 이미 생성된 오류는 그대로 반환
    }

    console.error('[공개 API 오류] 복지 서비스 상세 조회 실패:', error.message);

    throw createError({
      statusCode: 500,
      message: '복지 서비스 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
});

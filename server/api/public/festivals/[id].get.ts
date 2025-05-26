// server/api/public/festivals/[id].get.ts
import { defineEventHandler, createError } from 'h3';

import { sanitizeObjectHtmlFields } from '~/server/utils/sanitize';

interface FestivalDetail {
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
    // URL 파라미터에서 ID 추출
    const id = parseInt(event.context.params?.id as string);
    
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: '유효하지 않은 축제/행사 ID입니다.'
      });
    }
    
    // 상세 정보 조회 (노출 상태가 활성화된 항목만)
    const query = `
      SELECT 
        id, title, content_html, source_url, writer_name, written_date, files_info, fetched_at
      FROM festivals
      WHERE id = ? AND is_exposed = true
      LIMIT 1`;
    
    const results = await executeQuery<FestivalDetail[]>(query, [id]);
    
    if (!results || results.length === 0) {
      throw createError({
        statusCode: 404,
        message: '요청하신 축제/행사를 찾을 수 없습니다.'
      });
    }
    
    // HTML 필드 새니타이징
    const sanitizedItem = sanitizeObjectHtmlFields(results[0], ['content_html']);
    
    // files_info 처리
    let filesInfo;
    try {
      // JSON 문자열이면 파싱, 이미 객체면 그대로 사용
      filesInfo = typeof sanitizedItem.files_info === 'string' ? 
        JSON.parse(sanitizedItem.files_info) : sanitizedItem.files_info;
    } catch (e) {
      filesInfo = [];
    }
    
    // 응답 반환
    return {
      item: {
        ...sanitizedItem,
        files_info: filesInfo
      }
    };
  } catch (error: any) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      throw error; // 이미 생성된 오류는 그대로 반환
    }
    
    console.error('[공개 API 오류] 축제/행사 상세 조회 실패:', error.message);
    
    throw createError({
      statusCode: 500,
      message: '축제/행사 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
});

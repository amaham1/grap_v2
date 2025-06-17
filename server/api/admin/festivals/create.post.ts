import { defineEventHandler, readBody, createError } from 'h3';
import { festivalDAO } from '~/server/dao/supabase';
import type { Festival } from '~/server/dao/supabase/festival-dao';

interface CreateFestivalRequest {
  title: string;
  content: string;
  writer_name?: string | null;
  source_url?: string | null;
  is_exposed?: boolean;
  admin_memo?: string | null;
}

export default defineEventHandler(async (event) => {
  try {
    // 요청 본문 읽기
    const body = await readBody(event) as CreateFestivalRequest;
    
    // 입력 유효성 검사
    if (!body.title || !body.title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '축제 제목은 필수입니다.'
      });
    }
    
    if (!body.content || !body.content.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '축제 내용은 필수입니다.'
      });
    }
    
    // URL 유효성 검사 (제공된 경우)
    if (body.source_url && body.source_url.trim()) {
      try {
        new URL(body.source_url.trim());
      } catch {
        throw createError({
          statusCode: 400,
          statusMessage: '올바른 URL 형식이 아닙니다.'
        });
      }
    }
    
    // 제목 길이 검사
    if (body.title.trim().length > 200) {
      throw createError({
        statusCode: 400,
        statusMessage: '축제 제목은 200자를 초과할 수 없습니다.'
      });
    }
    
    // 내용 길이 검사
    if (body.content.trim().length > 5000) {
      throw createError({
        statusCode: 400,
        statusMessage: '축제 내용은 5000자를 초과할 수 없습니다.'
      });
    }
    
    // 작성자명 길이 검사
    if (body.writer_name && body.writer_name.trim().length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: '작성자명은 100자를 초과할 수 없습니다.'
      });
    }
    
    // 관리자 메모 길이 검사
    if (body.admin_memo && body.admin_memo.trim().length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: '관리자 메모는 500자를 초과할 수 없습니다.'
      });
    }
    
    // 현재 시간
    const now = new Date().toISOString();
    
    // 수동 등록용 고유 ID 생성 (manual_ + timestamp + random)
    const manualId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Festival 데이터 구성
    const festivalData: Festival = {
      original_api_id: manualId, // 수동 등록임을 나타내는 고유 ID
      title: body.title.trim(),
      content_html: formatContentToHtml(body.content.trim()), // 개행을 HTML로 변환
      content: body.content.trim(), // 원본 텍스트 그대로 저장
      source_url: body.source_url?.trim() || '',
      writer_name: body.writer_name?.trim() || '',
      written_date: now, // 현재 시간을 작성일로 설정
      files_info: {}, // 빈 객체
      api_raw_data: {
        // 수동 등록임을 나타내는 메타데이터
        source: 'manual_admin_input',
        created_at: now,
        original_content: body.content.trim() // 원본 텍스트 보존
      },
      is_exposed: body.is_exposed || false,
      admin_memo: body.admin_memo?.trim() || '',
      fetched_at: now,
      created_at: now,
      updated_at: now
    };
    
    // 데이터베이스에 저장
    const result = await festivalDAO.upsertFestival(festivalData);
    
    if (result.error) {
      console.error('[축제 등록 오류]', result.error);
      throw createError({
        statusCode: 500,
        statusMessage: '축제 등록 중 데이터베이스 오류가 발생했습니다.'
      });
    }
    
    console.log(`[축제 등록 성공] 제목: ${body.title.trim()}, ID: ${manualId}`);
    
    return {
      success: true,
      message: '축제가 성공적으로 등록되었습니다.',
      data: {
        id: result.data?.[0]?.id,
        original_api_id: manualId,
        title: body.title.trim(),
        is_exposed: body.is_exposed || false
      }
    };
    
  } catch (error: any) {
    console.error('[축제 등록 API 오류]', error);
    
    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }
    
    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '축제 등록 중 서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 텍스트 내용을 HTML로 변환
 * 개행을 <br> 태그로 변환하고 HTML 특수문자를 이스케이프
 */
function formatContentToHtml(content: string): string {
  if (!content) return '';
  
  // HTML 특수문자 이스케이프
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // 개행을 <br> 태그로 변환
  return escaped.replace(/\n/g, '<br>');
}

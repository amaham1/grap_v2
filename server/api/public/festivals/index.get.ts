// server/api/public/festivals/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { executeQuery } from '~/server/utils/db';
import { sanitizeItemsHtmlFields } from '~/server/utils/sanitize';

interface FestivalPublic {
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
    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const search = query.search as string || '';
    const sortBy = query.sortBy as string || 'written_date';
    const sortOrder = (query.sortOrder as string || 'desc').toUpperCase();

    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw createError({
        statusCode: 400,
        message: '정렬 순서는 asc 또는 desc만 가능합니다.'
      });
    }

    const offset = (page - 1) * pageSize;

    // 디버깅: 전체 레코드 수 확인
    const totalCountQuery = 'SELECT COUNT(*) as total FROM festivals';
    const totalCountResult = await executeQuery<any[]>(totalCountQuery, []);
    console.log('[디버긱] 전체 festivals 테이블 레코드 수:', totalCountResult[0].total);

    // 디버깅: is_exposed=true인 레코드 수 확인
    const exposedCountQuery = 'SELECT COUNT(*) as total FROM festivals WHERE is_exposed = true';
    const exposedCountResult = await executeQuery<any[]>(exposedCountQuery, []);
    console.log('[디버긱] is_exposed=true인 축제/행사 수:', exposedCountResult[0].total);

    // 기본 필터 (노출 상태가 활성화된 항목만)
    // 임시로 노출 상태 필터 제거하고 모든 데이터 표시
    console.log('[디버긱] 임시로 노출 상태 필터(is_exposed=true) 제거하고 모든 데이터 표시함');
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // 검색어 필터
    if (search) {
      whereClause += ' AND (title LIKE ? OR content_html LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 전체 레코드 수 조회
    const countQuery = `SELECT COUNT(*) as total FROM festivals ${whereClause}`;
    const countResult = await executeQuery<any[]>(countQuery, params);
    const total = countResult[0].total;

    // 허용된 정렬 필드 검증
    const allowedSortFields = ['title', 'written_date', 'fetched_at'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'written_date';

    // 데이터 조회 (LIMIT과 OFFSET을 직접 쿼리에 포함)
    // LIMIT과 OFFSET을 정수로 확실히 변환
    const limitValue = parseInt(pageSize.toString(), 10);
    const offsetValue = parseInt(offset.toString(), 10);

    const dataQuery = `
      SELECT
        id, title, content_html, source_url, writer_name, written_date, files_info, fetched_at
      FROM festivals
      ${whereClause}
      ORDER BY ${orderByField} ${sortOrder}
      LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const items = await executeQuery<FestivalPublic[]>(dataQuery, params);

    // HTML 필드 새니타이징 및 files_info 처리
    const sanitizedItems = sanitizeItemsHtmlFields(items, ['content_html']).map(item => {
      let filesInfo;
      try {
        // JSON 문자열이면 파싱, 이미 객체면 그대로 사용
        filesInfo = typeof item.files_info === 'string' ?
          JSON.parse(item.files_info) : item.files_info;
      } catch (e) {
        filesInfo = [];
      }

      return {
        ...item,
        files_info: filesInfo
      };
    });

    // 응답 반환
    return {
      items: sanitizedItems,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize)
      }
    };
  } catch (error: any) {
    if (error.statusCode === 400) {
      throw error; // 이미 생성된 오류는 그대로 반환
    }

    console.error('[공개 API 오류] 축제/행사 목록 조회 실패:', error.message);

    throw createError({
      statusCode: 500,
      message: '축제/행사 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

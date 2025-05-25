// server/api/public/exhibitions/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { executeQuery } from '~/server/utils/db';
import { sanitizeItemsHtmlFields } from '~/server/utils/sanitize';

interface ExhibitionPublic {
  id: number;
  title: string;
  category_name: string;
  cover_image_url: string;
  start_date: Date;
  end_date: Date;
  time_info: string;
  pay_info: string;
  location_name: string;
  organizer_info: string;
  tel_number: string;
  status_info: string;
  division_name: string;
  fetched_at: Date;
}

export default defineEventHandler(async (event) => {
  try {
    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const search = query.search as string || '';
    const category = query.category as string || '';
    const sortBy = query.sortBy as string || 'start_date';
    const sortOrder = (query.sortOrder as string || 'desc').toUpperCase();

    // 현재 날짜 (오늘 이후 공연/전시 필터링용)
    const now = new Date();
    const showPast = query.showPast === 'true';

    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw createError({
        statusCode: 400,
        message: '정렬 순서는 asc 또는 desc만 가능합니다.'
      });
    }

    const offset = (page - 1) * pageSize;

    // 디버깅을 위해 필터를 하나씩 추가하면서 출력
    let whereClause = '';
    const params: any[] = [];

    // 디버긱 테스트: 조회 가능한 전체 레코드 수 확인
    const totalCountQuery = 'SELECT COUNT(*) as total FROM exhibitions';
    const totalCountResult = await executeQuery<any[]>(totalCountQuery, []);
    console.log(`[디버긱] 전체 exhibitions 테이블 레코드 수:`, totalCountResult[0].total);

    // 임시로 노출 상태 필터 제거
    whereClause = 'WHERE 1=1'; // 모든 데이터 표시
    console.log(`[디버긱] 임시로 노출 상태 필터(is_exposed=true) 제거하고 모든 데이터 표시함`);

    // 디버긱 테스트: is_exposed 필터만 적용했을 때 레코드 수 확인
    const exposedCountQuery = `SELECT COUNT(*) as total FROM exhibitions ${whereClause}`;
    const exposedCountResult = await executeQuery<any[]>(exposedCountQuery, params);
    console.log(`[디버긱] is_exposed=true 조건 필터만 적용했을 때 레코드 수:`, exposedCountResult[0].total);

    // 현재 날짜 이후의 공연/전시만 보여줄지 여부
    if (!showPast) {
      whereClause += ' AND end_date >= ?';
      params.push(now);

      // 디버긱 테스트: 날짜 필터까지 적용했을 때 레코드 수 확인
      const dateFilteredCountQuery = `SELECT COUNT(*) as total FROM exhibitions ${whereClause}`;
      const dateFilteredCountResult = await executeQuery<any[]>(dateFilteredCountQuery, params);
      console.log(`[디버긱] is_exposed=true, end_date >= now 조건 적용했을 때 레코드 수:`, dateFilteredCountResult[0].total);
      console.log(`[디버긱] 현재 날짜:`, now);
    } else {
      console.log(`[디버긱] showPast=true 이미로 날짜 필터 적용하지 않음`);
    }

    // 검색어 필터
    if (search) {
      whereClause += ' AND (title LIKE ? OR location_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 카테고리 필터
    if (category) {
      whereClause += ' AND category_name = ?';
      params.push(category);
    }

    // 전체 레코드 수 조회
    const countQuery = `SELECT COUNT(*) as total FROM exhibitions ${whereClause}`;
    const countResult = await executeQuery<any[]>(countQuery, params);
    const total = countResult[0].total;

    // 허용된 정렬 필드 검증
    const allowedSortFields = ['title', 'start_date', 'end_date', 'category_name'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'start_date';

    // 전체 조건을 적용했을 때 레코드 수 확인 (검색어, 카테고리 필터 포함)
    const finalCountQuery = `SELECT COUNT(*) as total FROM exhibitions ${whereClause}`;
    const finalCountResult = await executeQuery<any[]>(finalCountQuery, params);
    console.log(`[디버긱] 모든 필터 적용했을 때 레코드 수:`, finalCountResult[0].total);
    console.log(`[디버긱] 최종 SQL WHERE 절:`, whereClause);
    console.log(`[디버긱] 최종 파라미터:`, params);

    // 데이터 조회 (LIMIT과 OFFSET을 직접 쿼리에 포함)
    // LIMIT과 OFFSET을 정수로 확실히 변환
    const limitValue = parseInt(pageSize.toString(), 10);
    const offsetValue = parseInt(offset.toString(), 10);

    const dataQuery = `
      SELECT
        id, title, category_name, cover_image_url, start_date, end_date,
        time_info, pay_info, location_name, organizer_info, tel_number,
        status_info, division_name, fetched_at
      FROM exhibitions
      ${whereClause}
      ORDER BY ${orderByField} ${sortOrder}
      LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const items = await executeQuery<ExhibitionPublic[]>(dataQuery, params);
    console.log(`[디버긱] 최종 조회된 항목 수:`, items.length);

    // 응답 반환
    return {
      items: items,
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

    console.error('[공개 API 오류] 공연/전시 목록 조회 실패:', error.message);

    throw createError({
      statusCode: 500,
      message: '공연/전시 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

// server/api/public/welfare-services/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { executeQuery } from '~/server/utils/db';
import { sanitizeItemsHtmlFields } from '~/server/utils/sanitize';

interface WelfareServicePublic {
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
    // 디버긱 테스트: 전체 welfare_services 테이블 레코드 수 확인
    const totalCountQuery = 'SELECT COUNT(*) as total FROM welfare_services';
    const totalCountResult = await executeQuery<any[]>(totalCountQuery, []);
    console.log(`[디버긱] 전체 welfare_services 테이블 레코드 수:`, totalCountResult[0].total);
    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const search = query.search as string || '';
    const location = query.location as string || '';
    
    const offset = (page - 1) * pageSize;
    
    // 기본 필터 - 임시로 노출 상태 필터 제거
    let whereClause = 'WHERE 1=1'; // 모든 데이터 표시
    const params: any[] = [];
    
    console.log(`[디버긱] 임시로 노출 상태 필터(is_exposed=true) 제거하고 모든 데이터 표시함`);
    
    // 디버긱 테스트: is_exposed=true 필터만 적용했을 때 레코드 수 확인
    const exposedCountQuery = `SELECT COUNT(*) as total FROM welfare_services ${whereClause}`;
    const exposedCountResult = await executeQuery<any[]>(exposedCountQuery, params);
    console.log(`[디버긱] is_exposed=true 조건 필터만 적용했을 때 레코드 수:`, exposedCountResult[0].total);
    
    // 검색어 필터
    if (search) {
      whereClause += ' AND service_name LIKE ?';
      params.push(`%${search}%`);
    }
    
    // 지역 필터
    if (location) {
      switch(location) {
        case 'all':
          whereClause += ' AND is_all_location = true';
          break;
        case 'jeju':
          whereClause += ' AND is_jeju_location = true';
          break;
        case 'seogwipo':
          whereClause += ' AND is_seogwipo_location = true';
          break;
      }
    }
    
    // 전체 레코드 수 조회 및 추가 디버긱 로그
    const countQuery = `SELECT COUNT(*) as total FROM welfare_services ${whereClause}`;
    const countResult = await executeQuery<any[]>(countQuery, params);
    const total = countResult[0].total;
    
    console.log(`[디버긱] 최종 SQL WHERE 절:`, whereClause);
    console.log(`[디버긱] 최종 파라미터:`, params);
    console.log(`[디버긱] 최종 조회될 레코드 수:`, total);
    
    // 데이터 조회
    const dataQuery = `
      SELECT 
        id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, 
        support_target_html, support_content_html, application_info_html, fetched_at
      FROM welfare_services
      ${whereClause}
      ORDER BY service_name ASC
      LIMIT ? OFFSET ?`;
    
    const items = await executeQuery<WelfareServicePublic[]>(dataQuery, [...params, pageSize, offset]);
    console.log(`[디버긱] 실제 조회된 항목 수:`, items.length);
    
    // 디버긱 테스트: 테이블 스키마 확인
    if (items.length === 0) {
      const schemaQuery = "DESCRIBE welfare_services";
      try {
        const schemaResult = await executeQuery<any[]>(schemaQuery, []);
        console.log(`[디버긱] welfare_services 테이블 스키마:`, schemaResult);
      } catch (e) {
        console.error(`[디버긱] 테이블 스키마 조회 오류:`, e);
      }
      
      // 샘플 데이터 확인
      const sampleQuery = "SELECT * FROM welfare_services LIMIT 1";
      try {
        const sampleResult = await executeQuery<any[]>(sampleQuery, []);
        console.log(`[디버긱] welfare_services 샘플 데이터:`, sampleResult);
      } catch (e) {
        console.error(`[디버긱] 샘플 데이터 조회 오류:`, e);
      }
    }
    
    // HTML 필드 새니타이징
    const sanitizedItems = sanitizeItemsHtmlFields(items, [
      'support_target_html', 
      'support_content_html', 
      'application_info_html'
    ]);
    
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
    console.error('[공개 API 오류] 복지 서비스 목록 조회 실패:', error.message);
    
    throw createError({
      statusCode: 500,
      message: '복지 서비스 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

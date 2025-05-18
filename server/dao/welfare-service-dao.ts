// server/dao/welfare-service-dao.ts
import mysql from 'mysql2/promise';
import { executeQuery } from '~/server/utils/db';

export interface WelfareService {
  id?: number;
  original_api_id: string;
  service_name: string;
  is_all_location: boolean;
  is_jeju_location: boolean;
  is_seogwipo_location: boolean;
  support_target_html: string;
  support_content_html: string;
  application_info_html: string;
  api_raw_data: any;
  is_exposed: boolean;
  admin_memo?: string;
  fetched_at?: Date; // 스네이크 케이스로 수정
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 새로운 복지서비스 데이터를 삽입하거나 이미 존재하는 경우 업데이트합니다 (upsert)
 */
export async function upsertWelfareService(connection: mysql.Connection, service: WelfareService): Promise<{ id: number, isNew: boolean }> {
  const now = new Date();
  
  // 이미 존재하는지 확인
  const checkQuery = 'SELECT id FROM welfare_services WHERE original_api_id = ?';
  const existingResult = await connection.query(checkQuery, [service.original_api_id]);
  const existingRows = existingResult[0] as any[];
  
  if (existingRows.length > 0) {
    // 업데이트
    const id = existingRows[0].id;
    const updateQuery = `
      UPDATE welfare_services SET
        service_name = ?,
        is_all_location = ?,
        is_jeju_location = ?,
        is_seogwipo_location = ?,
        support_target_html = ?,
        support_content_html = ?,
        application_info_html = ?,
        api_raw_data = ?,
        updated_at = ?
      WHERE id = ?`;
    
    await connection.execute(updateQuery, [
      service.service_name,
      service.is_all_location,
      service.is_jeju_location,
      service.is_seogwipo_location,
      service.support_target_html,
      service.support_content_html,
      service.application_info_html,
      JSON.stringify(service.api_raw_data),
      now,
      id
    ]);
    
    return { id, isNew: false };
  } else {
    // 삽입
    const insertQuery = `
      INSERT INTO welfare_services (
        original_api_id, service_name, is_all_location, is_jeju_location, is_seogwipo_location,
        support_target_html, support_content_html, application_info_html, 
        api_raw_data, is_exposed, fetched_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await connection.execute(insertQuery, [
      service.original_api_id,
      service.service_name,
      service.is_all_location,
      service.is_jeju_location,
      service.is_seogwipo_location,
      service.support_target_html,
      service.support_content_html,
      service.application_info_html,
      JSON.stringify(service.api_raw_data),
      false, // 기본적으로 노출하지 않음
      now,
      now,
      now
    ]);
    
    const insertId = (result[0] as any).insertId;
    return { id: insertId, isNew: true };
  }
}

const CHUNK_SIZE_WELFARE = 500; // 한 번에 처리할 최대 항목 수

export async function batchUpsertWelfareServices(
  connection: mysql.Connection,
  services: WelfareService[]
): Promise<{ processedCount: number; newItemsCount: number; updatedItemsCount: number; }> {
  if (services.length === 0) {
    return { processedCount: 0, newItemsCount: 0, updatedItemsCount: 0 };
  }

  const now = new Date();
  let totalProcessedCount = 0;
  let totalNewItemsCount = 0;
  let totalUpdatedItemsCount = 0;

  for (let i = 0; i < services.length; i += CHUNK_SIZE_WELFARE) {
    const chunk = services.slice(i, i + CHUNK_SIZE_WELFARE);
    if (chunk.length === 0) continue;

    console.log(`[DAO_Welfare] Processing chunk ${Math.floor(i / CHUNK_SIZE_WELFARE) + 1}, size: ${chunk.length}`);

    const existingApiIdsInChunk = new Set<string>();
    const apiIdsToCheckInChunk = chunk.map(s => s.original_api_id);
    
    if (apiIdsToCheckInChunk.length > 0) {
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT original_api_id FROM welfare_services WHERE original_api_id IN (?)`,
        [apiIdsToCheckInChunk]
      );
      rows.forEach(row => existingApiIdsInChunk.add(row.original_api_id));
    }

    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const values: any[] = [];
    chunk.forEach(s => {
      values.push(
        s.original_api_id,
        s.service_name,
        s.is_all_location,
        s.is_jeju_location,
        s.is_seogwipo_location,
        s.support_target_html,
        s.support_content_html,
        s.application_info_html,
        JSON.stringify(s.api_raw_data),
        s.is_exposed || false,
        s.fetched_at || now, // cron에서 이미 설정되었거나, 여기서 설정
        now, // created_at
        now  // updated_at (INSERT 시)
      );
    });

    const query = `
      INSERT INTO welfare_services (
        original_api_id, service_name, is_all_location, is_jeju_location, is_seogwipo_location,
        support_target_html, support_content_html, application_info_html,
        api_raw_data, is_exposed, fetched_at, created_at, updated_at
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        service_name = VALUES(service_name),
        is_all_location = VALUES(is_all_location),
        is_jeju_location = VALUES(is_jeju_location),
        is_seogwipo_location = VALUES(is_seogwipo_location),
        support_target_html = VALUES(support_target_html),
        support_content_html = VALUES(support_content_html),
        application_info_html = VALUES(application_info_html),
        api_raw_data = VALUES(api_raw_data),
        is_exposed = VALUES(is_exposed),
        fetched_at = VALUES(fetched_at),
        updated_at = NOW();
    `;

    try {
      await connection.execute(query, values);
    } catch (error) {
      console.error(`[DAO_Welfare] Error executing batch upsert for chunk ${Math.floor(i / CHUNK_SIZE_WELFARE) + 1}:`, error);
      throw error; 
    }
    
    let newItemsInChunk = 0;
    let updatedItemsInChunk = 0;

    chunk.forEach(s => {
      if (existingApiIdsInChunk.has(s.original_api_id)) {
        updatedItemsInChunk++;
      } else {
        newItemsInChunk++;
      }
    });

    totalProcessedCount += chunk.length;
    totalNewItemsCount += newItemsInChunk;
    totalUpdatedItemsCount += updatedItemsInChunk;

    console.log(`[DAO_Welfare] Chunk ${Math.floor(i / CHUNK_SIZE_WELFARE) + 1} processed. New: ${newItemsInChunk}, Updated: ${updatedItemsInChunk}`);
  }
 
  return {
    processedCount: totalProcessedCount,
    newItemsCount: totalNewItemsCount,
    updatedItemsCount: totalUpdatedItemsCount
  };
}

/**
 * 복지서비스 데이터 목록을 페이지네이션하여 조회합니다.
 */
export async function getWelfareServices(
  page: number = 1,
  pageSize: number = 10,
  filters: { search?: string, location?: string, isExposed?: boolean } = {}
): Promise<{ items: WelfareService[], total: number }> {
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params: any[] = [];
  
  if (filters.search) {
    whereClause = 'WHERE service_name LIKE ?';
    params.push(`%${filters.search}%`);
  }
  
  if (filters.location) {
    let locationClause = '';
    switch (filters.location.toLowerCase()) {
      case 'all':
        locationClause = 'is_all_location = 1';
        break;
      case 'jeju':
        locationClause = 'is_jeju_location = 1';
        break;
      case 'seogwipo':
        locationClause = 'is_seogwipo_location = 1';
        break;
    }
    
    if (locationClause) {
      whereClause = whereClause ? `${whereClause} AND ${locationClause}` : `WHERE ${locationClause}`;
    }
  }
  
  if (filters.isExposed !== undefined) {
    whereClause = whereClause ? `${whereClause} AND is_exposed = ?` : 'WHERE is_exposed = ?';
    params.push(filters.isExposed);
  }
  
  const countQuery = `SELECT COUNT(*) as total FROM welfare_services ${whereClause}`;
  const countResult = await executeQuery<any[]>(countQuery, params);
  
  const query = `
    SELECT * FROM welfare_services
    ${whereClause}
    ORDER BY service_name ASC
    LIMIT ? OFFSET ?`;
  
  const items = await executeQuery<WelfareService[]>(query, [...params, pageSize, offset]);
  
  return {
    items,
    total: countResult[0].total
  };
}

/**
 * 단일 복지서비스 데이터를 ID로 조회합니다.
 */
export async function getWelfareServiceById(id: number): Promise<WelfareService | null> {
  const query = 'SELECT * FROM welfare_services WHERE id = ?';
  const results = await executeQuery<WelfareService[]>(query, [id]);
  
  return results.length > 0 ? results[0] : null;
}

/**
 * 복지서비스 데이터의 노출 여부를 변경합니다.
 */
export async function updateWelfareServiceExposure(id: number, isExposed: boolean): Promise<boolean> {
  const query = 'UPDATE welfare_services SET is_exposed = ?, updated_at = ? WHERE id = ?';
  const result = await executeQuery<any>(query, [isExposed, new Date(), id]);
  
  return (result as any).affectedRows > 0;
}

/**
 * 관리자 메모를 업데이트합니다.
 */
export async function updateWelfareServiceAdminMemo(id: number, adminMemo: string): Promise<boolean> {
  const query = 'UPDATE welfare_services SET admin_memo = ?, updated_at = ? WHERE id = ?';
  const result = await executeQuery<any>(query, [adminMemo, new Date(), id]);
  
  return (result as any).affectedRows > 0;
}

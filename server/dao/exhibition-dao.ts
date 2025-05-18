// server/dao/exhibition-dao.ts
import mysql from 'mysql2/promise';
import { executeQuery } from '~/server/utils/db';

export interface Exhibition {
  id?: number;
  original_api_id: string;
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
  api_raw_data: any;
  is_exposed: boolean;
  admin_memo?: string;
  fetched_at?: Date; // 스네이크 케이스로 수정
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 여러 공연/전시 데이터를 한 번의 쿼리로 삽입하거나 업데이트합니다 (batch upsert).
 */
const CHUNK_SIZE = 500; // 한 번에 처리할 최대 항목 수

export async function batchUpsertExhibitions(
  connection: mysql.Connection,
  exhibitions: Exhibition[]
): Promise<{ processedCount: number; newItemsCount: number; updatedItemsCount: number; }> {
  if (exhibitions.length === 0) {
    return { processedCount: 0, newItemsCount: 0, updatedItemsCount: 0 };
  }

  const now = new Date();
  let totalProcessedCount = 0;
  let totalNewItemsCount = 0;
  let totalUpdatedItemsCount = 0;

  for (let i = 0; i < exhibitions.length; i += CHUNK_SIZE) {
    const chunk = exhibitions.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;

    console.log(`[DAO] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}, size: ${chunk.length}`);

    // 1. 현재 청크의 DB에서 이미 존재하는 original_api_id 조회
    const existingApiIdsInChunk = new Set<string>();
    const apiIdsToCheckInChunk = chunk.map(ex => ex.original_api_id);
    
    if (apiIdsToCheckInChunk.length > 0) {
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT original_api_id FROM exhibitions WHERE original_api_id IN (?)`,
        [apiIdsToCheckInChunk]
      );
      rows.forEach(row => existingApiIdsInChunk.add(row.original_api_id));
    }

    // 2. INSERT ... ON DUPLICATE KEY UPDATE 쿼리 생성 (현재 청크용)
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const values: any[] = [];
    chunk.forEach(ex => {
      values.push(
        ex.original_api_id,
        ex.title,
        ex.category_name,
        ex.cover_image_url,
        ex.start_date, 
        ex.end_date,   
        ex.time_info,
        ex.pay_info,
        ex.location_name,
        ex.organizer_info,
        ex.tel_number,
        ex.status_info,
        ex.division_name,
        JSON.stringify(ex.api_raw_data),
        ex.is_exposed || false,
        ex.fetched_at || now, 
        now, // created_at
        now  // updated_at (INSERT 시)
      );
    });

    const query = `
      INSERT INTO exhibitions (
        original_api_id, title, category_name, cover_image_url, start_date, end_date,
        time_info, pay_info, location_name, organizer_info, tel_number, status_info,
        division_name, api_raw_data, is_exposed, fetched_at, created_at, updated_at
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        category_name = VALUES(category_name),
        cover_image_url = VALUES(cover_image_url),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        time_info = VALUES(time_info),
        pay_info = VALUES(pay_info),
        location_name = VALUES(location_name),
        organizer_info = VALUES(organizer_info),
        tel_number = VALUES(tel_number),
        status_info = VALUES(status_info),
        division_name = VALUES(division_name),
        api_raw_data = VALUES(api_raw_data),
        is_exposed = VALUES(is_exposed),
        fetched_at = VALUES(fetched_at), 
        updated_at = NOW();
    `;

    try {
        await connection.execute(query, values);
    } catch (error) {
        console.error(`[DAO] Error executing batch upsert for chunk ${Math.floor(i / CHUNK_SIZE) + 1}:`, error);
        // 청크 처리 중 오류 발생 시, 전체 작업을 실패로 간주하고 예외를 다시 던질 수 있습니다.
        // 또는 오류를 기록하고 다음 청크로 넘어갈 수도 있지만, 트랜잭션 관점에서 전체 롤백이 바람직할 수 있습니다.
        throw error; // 상위에서 트랜잭션 롤백을 위해 에러 전파
    }
    
    // 3. 결과 카운트 계산 (현재 청크용)
    let newItemsInChunk = 0;
    let updatedItemsInChunk = 0;

    chunk.forEach(ex => {
      if (existingApiIdsInChunk.has(ex.original_api_id)) {
        updatedItemsInChunk++;
      } else {
        newItemsInChunk++;
      }
    });

    totalProcessedCount += chunk.length;
    totalNewItemsCount += newItemsInChunk;
    totalUpdatedItemsCount += updatedItemsInChunk;

    console.log(`[DAO] Chunk ${Math.floor(i / CHUNK_SIZE) + 1} processed. New: ${newItemsInChunk}, Updated: ${updatedItemsInChunk}`);
  }
 
  return {
    processedCount: totalProcessedCount,
    newItemsCount: totalNewItemsCount,
    updatedItemsCount: totalUpdatedItemsCount
  };
}

/**
 * 공연/전시 데이터 목록을 페이지네이션하여 조회합니다.
 */
export async function getExhibitions(
  page: number = 1,
  pageSize: number = 10,
  filters: { search?: string, category?: string, startDate?: Date, endDate?: Date, isExposed?: boolean } = {}
): Promise<{ items: Exhibition[], total: number }> {
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params: any[] = [];
  
  if (filters.search) {
    whereClause = 'WHERE title LIKE ?';
    params.push(`%${filters.search}%`);
  }
  
  if (filters.category) {
    whereClause = whereClause ? `${whereClause} AND category_name = ?` : 'WHERE category_name = ?';
    params.push(filters.category);
  }
  
  if (filters.startDate) {
    whereClause = whereClause ? `${whereClause} AND end_date >= ?` : 'WHERE end_date >= ?';
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    whereClause = whereClause ? `${whereClause} AND start_date <= ?` : 'WHERE start_date <= ?';
    params.push(filters.endDate);
  }
  
  if (filters.isExposed !== undefined) {
    whereClause = whereClause ? `${whereClause} AND is_exposed = ?` : 'WHERE is_exposed = ?';
    params.push(filters.isExposed);
  }
  
  const countQuery = `SELECT COUNT(*) as total FROM exhibitions ${whereClause}`;
  const countResult = await executeQuery<any[]>(countQuery, params);
  
  const query = `
    SELECT * FROM exhibitions
    ${whereClause}
    ORDER BY start_date DESC, end_date DESC
    LIMIT ? OFFSET ?`;
  
  const items = await executeQuery<Exhibition[]>(query, [...params, pageSize, offset]);
  
  return {
    items,
    total: countResult[0].total
  };
}

/**
 * 단일 공연/전시 데이터를 ID로 조회합니다.
 */
export async function getExhibitionById(id: number): Promise<Exhibition | null> {
  const query = 'SELECT * FROM exhibitions WHERE id = ?';
  const results = await executeQuery<Exhibition[]>(query, [id]);
  
  return results.length > 0 ? results[0] : null;
}

/**
 * 공연/전시 데이터의 노출 여부를 변경합니다.
 */
export async function updateExhibitionExposure(id: number, isExposed: boolean): Promise<boolean> {
  const query = 'UPDATE exhibitions SET is_exposed = ?, updated_at = ? WHERE id = ?';
  const result = await executeQuery<any>(query, [isExposed, new Date(), id]);
  
  return (result as any).affectedRows > 0;
}

/**
 * 관리자 메모를 업데이트합니다.
 */
export async function updateExhibitionAdminMemo(id: number, adminMemo: string): Promise<boolean> {
  const query = 'UPDATE exhibitions SET admin_memo = ?, updated_at = ? WHERE id = ?';
  const result = await executeQuery<any>(query, [adminMemo, new Date(), id]);
  
  return (result as any).affectedRows > 0;
}

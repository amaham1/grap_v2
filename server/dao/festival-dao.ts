// server/dao/festival-dao.ts
import mysql from 'mysql2/promise';
import { executeQuery } from '~/server/utils/db';

export interface Festival {
  id?: number;
  original_api_id: string;
  title: string;
  content_html: string;
  source_url: string;
  writer_name: string;
  written_date: Date;
  files_info: any;
  api_raw_data: any;
  is_exposed: boolean;
  admin_memo?: string;
  fetched_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 새로운 행사/축제 데이터를 삽입하거나 이미 존재하는 경우 업데이트합니다 (upsert)
 */
export async function upsertFestival(connection: mysql.Connection, festival: Festival): Promise<{ id: number, isNew: boolean }> {
  const now = new Date();
  
  // 이미 존재하는지 확인
  const checkQuery = 'SELECT id FROM festivals WHERE original_api_id = ?';
  const existingResult = await connection.query(checkQuery, [festival.original_api_id]);
  const existingRows = existingResult[0] as any[];
  
  if (existingRows.length > 0) {
    // 업데이트
    const id = existingRows[0].id;
    const updateQuery = `
      UPDATE festivals SET
        title = ?,
        content_html = ?,
        source_url = ?,
        writer_name = ?,
        written_date = ?,
        files_info = ?,
        api_raw_data = ?,
        updated_at = ?
      WHERE id = ?`;
    
    await connection.execute(updateQuery, [
      festival.title,
      festival.content_html,
      festival.source_url,
      festival.writer_name,
      festival.written_date,
      JSON.stringify(festival.files_info),
      JSON.stringify(festival.api_raw_data),
      now,
      id
    ]);
    
    return { id, isNew: false };
  } else {
    // 삽입
    const insertQuery = `
      INSERT INTO festivals (
        original_api_id, title, content_html, source_url, writer_name, written_date,
        files_info, api_raw_data, is_exposed, fetched_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await connection.execute(insertQuery, [
      festival.original_api_id,
      festival.title,
      festival.content_html,
      festival.source_url,
      festival.writer_name,
      festival.written_date,
      JSON.stringify(festival.files_info),
      JSON.stringify(festival.api_raw_data),
      false, // 기본적으로 노출하지 않음
      now,
      now,
      now
    ]);
    
    const insertId = (result[0] as any).insertId;
    return { id: insertId, isNew: true };
  }
}

/**
 * 행사/축제 데이터 목록을 페이지네이션하여 조회합니다.
 */
export async function getFestivals(
  page: number = 1,
  pageSize: number = 10,
  filters: { search?: string, isExposed?: boolean } = {}
): Promise<{ items: Festival[], total: number }> {
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params: any[] = [];
  
  if (filters.search) {
    whereClause = 'WHERE title LIKE ?';
    params.push(`%${filters.search}%`);
  }
  
  if (filters.isExposed !== undefined) {
    whereClause = whereClause ? `${whereClause} AND is_exposed = ?` : 'WHERE is_exposed = ?';
    params.push(filters.isExposed);
  }
  
  const countQuery = `SELECT COUNT(*) as total FROM festivals ${whereClause}`;
  const countResult = await executeQuery<any[]>(countQuery, params);
  
  const query = `
    SELECT * FROM festivals
    ${whereClause}
    ORDER BY written_date DESC
    LIMIT ? OFFSET ?`;
  
  const items = await executeQuery<Festival[]>(query, [...params, pageSize, offset]);
  
  return {
    items,
    total: countResult[0].total
  };
}

/**
 * 단일 행사/축제 데이터를 ID로 조회합니다.
 */
export async function getFestivalById(id: number): Promise<Festival | null> {
  const query = 'SELECT * FROM festivals WHERE id = ?';
  const results = await executeQuery<Festival[]>(query, [id]);
  
  return results.length > 0 ? results[0] : null;
}

/**
 * 행사/축제 데이터의 노출 여부를 변경합니다.
 */
export async function updateFestivalExposure(id: number, isExposed: boolean): Promise<boolean> {
  const query = 'UPDATE festivals SET is_exposed = ?, updated_at = ? WHERE id = ?';
  const result = await executeQuery<any>(query, [isExposed, new Date(), id]);
  
  return (result as any).affectedRows > 0;
}

/**
 * 관리자 메모를 업데이트합니다.
 */
export async function updateFestivalAdminMemo(id: number, adminMemo: string): Promise<boolean> {
  const query = 'UPDATE festivals SET admin_memo = ?, updated_at = ? WHERE id = ?';
  const result = await executeQuery<any>(query, [adminMemo, new Date(), id]);
  
  return (result as any).affectedRows > 0;
}

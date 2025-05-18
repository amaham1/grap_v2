// server/dao/log-dao.ts
import mysql from 'mysql2/promise';
import { executeQuery } from '~/server/utils/db';

export interface ApiFetchLog {
  log_id?: number;
  source_name: string;
  fetch_timestamp: Date;
  status: 'SUCCESS' | 'FAILURE' | 'RETRYING';
  retry_count?: number;
  processed_items?: number;
  new_items?: number;
  updated_items?: number;
  error_message?: string;
  error_details?: string;
}

export interface SystemErrorLog {
  log_id?: number;
  error_timestamp: Date;
  error_code: string;
  message: string;
  details?: string;
  request_path?: string;
  request_method?: string;
  ip_address?: string;
  user_agent?: string;
  resolved_status: boolean;
}

/**
 * API 데이터 수집 로그를 기록합니다.
 */
export async function createApiFetchLog(connection: mysql.Connection, log: ApiFetchLog): Promise<number> {
  const query = `
    INSERT INTO api_fetch_logs (
      source_name, fetch_timestamp, status, retry_count, 
      processed_items, new_items, updated_items, 
      error_message, error_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const result = await connection.execute(query, [
    log.source_name,
    log.fetch_timestamp,
    log.status,
    log.retry_count || 0,
    log.processed_items || 0,
    log.new_items || 0,
    log.updated_items || 0,
    log.error_message || null,
    log.error_details || null
  ]);
  
  return (result[0] as any).insertId;
}

/**
 * 시스템 오류 로그를 기록합니다.
 */
export async function createSystemErrorLog(connection: mysql.Connection, log: SystemErrorLog): Promise<number> {
  const query = `
    INSERT INTO system_error_logs (
      error_timestamp, error_code, message, details, 
      request_path, request_method, ip_address, user_agent, 
      resolved_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const result = await connection.execute(query, [
    log.error_timestamp,
    log.error_code,
    log.message,
    log.details || null,
    log.request_path || null,
    log.request_method || null,
    log.ip_address || null,
    log.user_agent || null,
    log.resolved_status
  ]);
  
  return (result[0] as any).insertId;
}

/**
 * API 수집 로그를 조회합니다.
 */
export async function getApiFetchLogs(
  page: number = 1,
  pageSize: number = 10,
  filters: { sourceName?: string, status?: string, startDate?: Date, endDate?: Date } = {}
): Promise<{ logs: ApiFetchLog[], total: number }> {
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params: any[] = [];
  
  if (filters.sourceName) {
    whereClause = 'WHERE source_name = ?';
    params.push(filters.sourceName);
  }
  
  if (filters.status) {
    whereClause = whereClause ? `${whereClause} AND status = ?` : 'WHERE status = ?';
    params.push(filters.status);
  }
  
  if (filters.startDate) {
    whereClause = whereClause ? `${whereClause} AND fetch_timestamp >= ?` : 'WHERE fetch_timestamp >= ?';
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    whereClause = whereClause ? `${whereClause} AND fetch_timestamp <= ?` : 'WHERE fetch_timestamp <= ?';
    params.push(filters.endDate);
  }
  
  const countQuery = `SELECT COUNT(*) as total FROM api_fetch_logs ${whereClause}`;
  const countResult = await executeQuery<any[]>(countQuery, params);
  
  const query = `
    SELECT * FROM api_fetch_logs
    ${whereClause}
    ORDER BY fetch_timestamp DESC
    LIMIT ? OFFSET ?`;
  
  const logs = await executeQuery<ApiFetchLog[]>(query, [...params, pageSize, offset]);
  
  return {
    logs,
    total: countResult[0].total
  };
}

/**
 * 시스템 오류 로그를 조회합니다.
 */
export async function getSystemErrorLogs(
  page: number = 1,
  pageSize: number = 10,
  filters: { errorCode?: string, resolvedStatus?: boolean, startDate?: Date, endDate?: Date } = {}
): Promise<{ logs: SystemErrorLog[], total: number }> {
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params: any[] = [];
  
  if (filters.errorCode) {
    whereClause = 'WHERE error_code = ?';
    params.push(filters.errorCode);
  }
  
  if (filters.resolvedStatus !== undefined) {
    whereClause = whereClause ? `${whereClause} AND resolved_status = ?` : 'WHERE resolved_status = ?';
    params.push(filters.resolvedStatus);
  }
  
  if (filters.startDate) {
    whereClause = whereClause ? `${whereClause} AND error_timestamp >= ?` : 'WHERE error_timestamp >= ?';
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    whereClause = whereClause ? `${whereClause} AND error_timestamp <= ?` : 'WHERE error_timestamp <= ?';
    params.push(filters.endDate);
  }
  
  const countQuery = `SELECT COUNT(*) as total FROM system_error_logs ${whereClause}`;
  const countResult = await executeQuery<any[]>(countQuery, params);
  
  const query = `
    SELECT * FROM system_error_logs
    ${whereClause}
    ORDER BY error_timestamp DESC
    LIMIT ? OFFSET ?`;
  
  const logs = await executeQuery<SystemErrorLog[]>(query, [...params, pageSize, offset]);
  
  return {
    logs,
    total: countResult[0].total
  };
}

/**
 * 시스템 오류의 해결 상태를 업데이트합니다.
 */
export async function updateErrorResolvedStatus(logId: number, resolvedStatus: boolean): Promise<boolean> {
  const query = 'UPDATE system_error_logs SET resolved_status = ? WHERE log_id = ?';
  const result = await executeQuery<any>(query, [resolvedStatus, logId]);
  
  return (result as any).affectedRows > 0;
}

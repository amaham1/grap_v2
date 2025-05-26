// server/dao/supabase/log-dao.ts
import { executeSupabaseQuery } from '~/server/utils/supabase'

export interface ApiLog {
  id?: number
  endpoint: string
  method: string
  status_code: number
  request_data?: any
  response_data?: any
  error_message?: string
  execution_time?: number
  user_agent?: string
  ip_address?: string
  created_at?: string
}

export interface ApiFetchLog {
  id?: number
  source_name: string
  fetch_timestamp: Date | string
  status: 'SUCCESS' | 'FAILURE'
  retry_count?: number
  error_message?: string
  error_details?: string
  processed_items?: number
  new_items?: number
  updated_items?: number
  created_at?: string
}

export interface SystemErrorLog {
  id?: number
  error_type: string
  error_message: string
  error_details?: string
  stack_trace?: string
  context?: any
  created_at?: string
}

export interface GetApiLogsOptions {
  page?: number
  limit?: number
  endpoint?: string
  method?: string
  status_code?: number
  startDate?: string
  endDate?: string
  ip_address?: string
}

/**
 * API 로그 목록 조회 (페이징 지원)
 */
export async function getApiLogs(options: GetApiLogsOptions = {}) {
  const {
    page = 1,
    limit = 50,
    endpoint = '',
    method = '',
    status_code,
    ip_address = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = {}

  // 필터 조건 설정
  if (endpoint) filters.endpoint = `%${endpoint}%`
  if (method) filters.method = method
  if (status_code) filters.status_code = status_code
  if (ip_address) filters.ip_address = ip_address

  return await executeSupabaseQuery<ApiLog>('api_logs', 'select', {
    select: 'id, endpoint, method, status_code, execution_time, user_agent, ip_address, created_at',
    filters,
    orderBy: { column: 'created_at', ascending: false },
    limit,
    offset
  })
}

/**
 * 특정 API 로그 상세 정보 조회
 */
export async function getApiLogById(id: number) {
  const result = await executeSupabaseQuery<ApiLog>('api_logs', 'select', {
    filters: { id }
  })

  return result.data?.[0] || null
}

/**
 * API 로그 생성
 */
export async function createApiLog(logData: Omit<ApiLog, 'id' | 'created_at'>) {
  const data = {
    ...logData,
    request_data: typeof logData.request_data === 'string'
      ? JSON.parse(logData.request_data)
      : logData.request_data,
    response_data: typeof logData.response_data === 'string'
      ? JSON.parse(logData.response_data)
      : logData.response_data,
    created_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('api_logs', 'insert', { data })
}

/**
 * 여러 API 로그 배치 생성
 */
export async function batchCreateApiLogs(logs: Omit<ApiLog, 'id' | 'created_at'>[]) {
  const data = logs.map(log => ({
    ...log,
    request_data: typeof log.request_data === 'string'
      ? JSON.parse(log.request_data)
      : log.request_data,
    response_data: typeof log.response_data === 'string'
      ? JSON.parse(log.response_data)
      : log.response_data,
    created_at: new Date().toISOString()
  }))

  return await executeSupabaseQuery('api_logs', 'insert', { data })
}

/**
 * 오래된 로그 삭제 (일정 기간 이전)
 */
export async function deleteOldLogs(daysToKeep: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  const cutoffDateString = cutoffDate.toISOString()

  // Supabase에서는 날짜 비교를 위해 RPC 함수를 사용하거나
  // 클라이언트에서 처리해야 할 수 있습니다.
  // 여기서는 기본적인 구현을 제공합니다.

  const oldLogs = await executeSupabaseQuery<ApiLog>('api_logs', 'select', {
    select: 'id',
    filters: {},
    orderBy: { column: 'created_at', ascending: true },
    limit: 1000 // 한 번에 처리할 최대 개수
  })

  if (!oldLogs.data) return { success: false, error: oldLogs.error }

  // 클라이언트 사이드에서 날짜 필터링
  const logsToDelete = oldLogs.data.filter(log => {
    if (!log.created_at) return false
    return new Date(log.created_at) < cutoffDate
  })

  if (logsToDelete.length === 0) {
    return { success: true, deletedCount: 0 }
  }

  // 배치 삭제
  const deletePromises = logsToDelete.map(log =>
    executeSupabaseQuery('api_logs', 'delete', {
      filters: { id: log.id }
    })
  )

  try {
    await Promise.all(deletePromises)
    return { success: true, deletedCount: logsToDelete.length }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * 엔드포인트별 요청 통계 조회
 */
export async function getEndpointStats(days: number = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateString = startDate.toISOString()

  const result = await executeSupabaseQuery<ApiLog>('api_logs', 'select', {
    select: 'endpoint, method, status_code',
    filters: {},
    orderBy: { column: 'created_at', ascending: false },
    limit: 10000 // 충분한 데이터를 가져와서 클라이언트에서 처리
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 날짜 필터링 및 집계
  const filteredLogs = result.data.filter(log => {
    if (!log.created_at) return false
    return new Date(log.created_at) >= startDate
  })

  const stats = filteredLogs.reduce((acc, log) => {
    const key = `${log.method} ${log.endpoint}`
    if (!acc[key]) {
      acc[key] = {
        endpoint: log.endpoint,
        method: log.method,
        total_requests: 0,
        success_requests: 0,
        error_requests: 0
      }
    }

    acc[key].total_requests++
    if (log.status_code >= 200 && log.status_code < 400) {
      acc[key].success_requests++
    } else {
      acc[key].error_requests++
    }

    return acc
  }, {} as Record<string, any>)

  const statsList = Object.values(stats)
    .sort((a: any, b: any) => b.total_requests - a.total_requests)

  return { data: statsList, error: null }
}

/**
 * 상태 코드별 요청 통계 조회
 */
export async function getStatusCodeStats(days: number = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const result = await executeSupabaseQuery<ApiLog>('api_logs', 'select', {
    select: 'status_code, created_at',
    filters: {},
    orderBy: { column: 'created_at', ascending: false },
    limit: 10000
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 날짜 필터링 및 집계
  const filteredLogs = result.data.filter(log => {
    if (!log.created_at) return false
    return new Date(log.created_at) >= startDate
  })

  const stats = filteredLogs.reduce((acc, log) => {
    const statusCode = log.status_code.toString()
    acc[statusCode] = (acc[statusCode] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statsList = Object.entries(stats).map(([status_code, count]) => ({
    status_code: parseInt(status_code),
    count
  })).sort((a, b) => b.count - a.count)

  return { data: statsList, error: null }
}

/**
 * 시간별 요청 통계 조회
 */
export async function getHourlyStats(days: number = 1) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const result = await executeSupabaseQuery<ApiLog>('api_logs', 'select', {
    select: 'created_at',
    filters: {},
    orderBy: { column: 'created_at', ascending: false },
    limit: 10000
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 시간별 집계
  const hourlyStats = result.data
    .filter(log => {
      if (!log.created_at) return false
      return new Date(log.created_at) >= startDate
    })
    .reduce((acc, log) => {
      const hour = new Date(log.created_at!).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

  const statsList = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourlyStats[hour] || 0
  }))

  return { data: statsList, error: null }
}

/**
 * API 페치 로그 생성
 */
export async function createApiFetchLog(logData: Omit<ApiFetchLog, 'id' | 'created_at'>) {
  const data = {
    ...logData,
    fetch_timestamp: typeof logData.fetch_timestamp === 'string'
      ? logData.fetch_timestamp
      : logData.fetch_timestamp.toISOString(),
    created_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('api_fetch_logs', 'insert', { data })
}

/**
 * 시스템 에러 로그 생성
 */
export async function createSystemErrorLog(logData: Omit<SystemErrorLog, 'id' | 'created_at'>) {
  const data = {
    ...logData,
    context: typeof logData.context === 'string'
      ? JSON.parse(logData.context)
      : logData.context,
    created_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('system_error_logs', 'insert', { data })
}
// server/dao/supabase/welfare-service-dao.ts
import { executeSupabaseQuery, batchUpsert } from '~/server/utils/supabase'

export interface WelfareService {
  id?: number
  original_api_id: string
  service_name: string
  is_all_location: boolean
  is_jeju_location: boolean
  is_seogwipo_location: boolean
  support_target_html: string
  support_content_html: string
  application_info_html: string
  api_raw_data: any
  is_exposed: boolean
  admin_memo?: string
  fetched_at?: string
  created_at?: string
  updated_at?: string
}

export interface GetWelfareServicesOptions {
  page?: number
  limit?: number
  searchTerm?: string
  isExposed?: string
  location?: 'all' | 'jeju' | 'seogwipo'
}

/**
 * 복지 서비스 목록 조회 (페이징 지원)
 */
export async function getWelfareServices(options: GetWelfareServicesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    isExposed = '',
    location = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = {}

  // 필터 조건 설정
  if (isExposed === 'true') filters.is_exposed = true
  if (isExposed === 'false') filters.is_exposed = false
  if (searchTerm) filters.service_name = `%${searchTerm}%`

  // 지역 필터
  if (location === 'all') filters.is_all_location = true
  if (location === 'jeju') filters.is_jeju_location = true
  if (location === 'seogwipo') filters.is_seogwipo_location = true

  return await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'id, original_api_id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, is_exposed, fetched_at',
    filters,
    orderBy: { column: 'fetched_at', ascending: false },
    limit,
    offset
  })
}

/**
 * 공개된 복지 서비스 목록 조회 (공개 API용)
 */
export async function getPublicWelfareServices(options: GetWelfareServicesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    location = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = { is_exposed: true }

  if (searchTerm) filters.service_name = `%${searchTerm}%`

  // 지역 필터
  if (location === 'all') filters.is_all_location = true
  if (location === 'jeju') filters.is_jeju_location = true
  if (location === 'seogwipo') filters.is_seogwipo_location = true

  return await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, support_target_html, support_content_html, application_info_html, fetched_at',
    filters,
    orderBy: { column: 'fetched_at', ascending: false },
    limit,
    offset
  })
}

/**
 * 특정 복지 서비스 상세 정보 조회
 */
export async function getWelfareServiceById(id: number) {
  const result = await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    filters: { id }
  })

  return result.data?.[0] || null
}

/**
 * 공개된 복지 서비스 상세 정보 조회 (공개 API용)
 */
export async function getPublicWelfareServiceById(id: number) {
  const result = await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, support_target_html, support_content_html, application_info_html, fetched_at',
    filters: { id, is_exposed: true }
  })

  return result.data?.[0] || null
}

/**
 * original_api_id로 복지 서비스 조회
 */
export async function getWelfareServiceByOriginalApiId(original_api_id: string) {
  const result = await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    filters: { original_api_id }
  })

  return result.data?.[0] || null
}

/**
 * 복지 서비스 정보 삽입/업데이트 (upsert)
 */
export async function upsertWelfareService(service: WelfareService) {
  const data = {
    ...service,
    api_raw_data: typeof service.api_raw_data === 'string'
      ? JSON.parse(service.api_raw_data)
      : service.api_raw_data,
    fetched_at: service.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('welfare_services', 'upsert', {
    data,
    onConflict: 'original_api_id' // original_api_id 기준으로 업데이트
  })
}

/**
 * 여러 복지 서비스 정보 배치 삽입/업데이트
 */
export async function batchUpsertWelfareServices(services: WelfareService[]) {
  const data = services.map(service => ({
    ...service,
    api_raw_data: typeof service.api_raw_data === 'string'
      ? JSON.parse(service.api_raw_data)
      : service.api_raw_data,
    fetched_at: service.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return await batchUpsert('welfare_services', data, 1000, 'original_api_id')
}

/**
 * 복지 서비스 정보 업데이트
 */
export async function updateWelfareService(id: number, updateData: Partial<WelfareService>) {
  const data = {
    ...updateData,
    updated_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('welfare_services', 'update', {
    data,
    filters: { id }
  })
}

/**
 * 복지 서비스 노출 상태 업데이트
 */
export async function updateWelfareServiceExposure(id: number, isExposed: boolean, adminMemo?: string) {
  const data: Partial<WelfareService> = {
    is_exposed: isExposed,
    updated_at: new Date().toISOString()
  }

  if (adminMemo !== undefined) {
    data.admin_memo = adminMemo
  }

  return await executeSupabaseQuery('welfare_services', 'update', {
    data,
    filters: { id }
  })
}

/**
 * 복지 서비스 삭제
 */
export async function deleteWelfareService(id: number) {
  return await executeSupabaseQuery('welfare_services', 'delete', {
    filters: { id }
  })
}

/**
 * 지역별 복지 서비스 개수 조회
 */
export async function getWelfareServiceCountByLocation() {
  const result = await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'is_all_location, is_jeju_location, is_seogwipo_location',
    filters: { is_exposed: true }
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 집계
  const locationCount = {
    all: 0,
    jeju: 0,
    seogwipo: 0
  }

  result.data.forEach(service => {
    if (service.is_all_location) locationCount.all++
    if (service.is_jeju_location) locationCount.jeju++
    if (service.is_seogwipo_location) locationCount.seogwipo++
  })

  const locationList = [
    { location: 'all', name: '전체 지역', count: locationCount.all },
    { location: 'jeju', name: '제주시', count: locationCount.jeju },
    { location: 'seogwipo', name: '서귀포시', count: locationCount.seogwipo }
  ]

  return { data: locationList, error: null }
}

/**
 * 복지 서비스 검색 (서비스명, 지원 대상, 지원 내용)
 */
export async function searchWelfareServices(searchTerm: string, limit: number = 20) {
  // 서비스명 검색
  const nameResult = await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, support_target_html, support_content_html, fetched_at',
    filters: {
      is_exposed: true,
      service_name: `%${searchTerm}%`
    },
    orderBy: { column: 'fetched_at', ascending: false },
    limit: Math.floor(limit / 3)
  })

  // 지원 대상 검색
  const targetResult = await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, support_target_html, support_content_html, fetched_at',
    filters: {
      is_exposed: true,
      support_target_html: `%${searchTerm}%`
    },
    orderBy: { column: 'fetched_at', ascending: false },
    limit: Math.floor(limit / 3)
  })

  // 지원 내용 검색
  const contentResult = await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, support_target_html, support_content_html, fetched_at',
    filters: {
      is_exposed: true,
      support_content_html: `%${searchTerm}%`
    },
    orderBy: { column: 'fetched_at', ascending: false },
    limit: Math.floor(limit / 3)
  })

  // 결과 합치기 및 중복 제거
  const allResults = [
    ...(nameResult.data || []),
    ...(targetResult.data || []),
    ...(contentResult.data || [])
  ]

  const uniqueResults = allResults.filter((service, index, self) =>
    index === self.findIndex(s => s.id === service.id)
  ).slice(0, limit)

  return {
    data: uniqueResults,
    error: nameResult.error || targetResult.error || contentResult.error
  }
}

/**
 * 인기 복지 서비스 조회 (최근 업데이트 순)
 */
export async function getPopularWelfareServices(limit: number = 10) {
  return await executeSupabaseQuery<WelfareService>('welfare_services', 'select', {
    select: 'id, service_name, is_all_location, is_jeju_location, is_seogwipo_location, support_target_html, fetched_at',
    filters: { is_exposed: true },
    orderBy: { column: 'fetched_at', ascending: false },
    limit
  })
}

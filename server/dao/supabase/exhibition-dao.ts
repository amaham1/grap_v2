// server/dao/supabase/exhibition-dao.ts
import { executeSupabaseQuery, batchUpsert } from '~/server/utils/supabase'

export interface Exhibition {
  id?: number
  original_api_id?: string
  title?: string
  category_name?: string
  cover_image_url?: string
  start_date?: string
  end_date?: string
  time_info?: string
  pay_info?: string
  location_name?: string
  organizer_info?: string
  tel_number?: string
  status_info?: string
  division_name?: string
  api_raw_data: string
  is_exposed: boolean
  admin_memo?: string
  fetched_at: string
  created_at?: string
  updated_at?: string
}

export interface GetExhibitionsOptions {
  page?: number
  limit?: number
  searchTerm?: string
  isExposed?: string
  categoryName?: string
  startDate?: string
  endDate?: string
}

/**
 * 전시/공연 목록 조회 (페이징 지원)
 */
export async function getExhibitions(options: GetExhibitionsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    isExposed = '',
    categoryName = '',
    startDate = '',
    endDate = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = {}

  // 필터 조건 설정
  if (isExposed === 'true') filters.is_exposed = true
  if (isExposed === 'false') filters.is_exposed = false
  if (categoryName) filters.category_name = categoryName
  if (searchTerm) filters.title = `%${searchTerm}%`

  return await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    select: 'id, original_api_id, title, category_name, cover_image_url, start_date, end_date, location_name, is_exposed, fetched_at',
    filters,
    orderBy: { column: 'start_date', ascending: false },
    limit,
    offset
  })
}

/**
 * 공개된 전시/공연 목록 조회 (공개 API용)
 */
export async function getPublicExhibitions(options: GetExhibitionsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    categoryName = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = { is_exposed: true }

  if (categoryName) filters.category_name = categoryName
  if (searchTerm) filters.title = `%${searchTerm}%`

  return await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    select: 'id, title, category_name, cover_image_url, start_date, end_date, time_info, pay_info, location_name, organizer_info, tel_number, status_info, division_name, fetched_at',
    filters,
    orderBy: { column: 'start_date', ascending: false },
    limit,
    offset
  })
}

/**
 * 특정 전시/공연 상세 정보 조회
 */
export async function getExhibitionById(id: number) {
  const result = await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    filters: { id }
  })
  
  return result.data?.[0] || null
}

/**
 * 공개된 전시/공연 상세 정보 조회 (공개 API용)
 */
export async function getPublicExhibitionById(id: number) {
  const result = await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    select: 'id, title, category_name, cover_image_url, start_date, end_date, time_info, pay_info, location_name, organizer_info, tel_number, status_info, division_name, fetched_at',
    filters: { id, is_exposed: true }
  })
  
  return result.data?.[0] || null
}

/**
 * original_api_id로 전시/공연 조회
 */
export async function getExhibitionByOriginalApiId(original_api_id: string) {
  const result = await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    filters: { original_api_id }
  })
  
  return result.data?.[0] || null
}

/**
 * 전시/공연 정보 삽입/업데이트 (upsert)
 */
export async function upsertExhibition(exhibition: Exhibition) {
  const data = {
    ...exhibition,
    fetched_at: exhibition.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('exhibitions', 'upsert', { data })
}

/**
 * 여러 전시/공연 정보 배치 삽입/업데이트
 */
export async function batchUpsertExhibitions(exhibitions: Exhibition[]) {
  const data = exhibitions.map(exhibition => ({
    ...exhibition,
    fetched_at: exhibition.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return await batchUpsert('exhibitions', data)
}

/**
 * 전시/공연 노출 상태 업데이트
 */
export async function updateExhibitionExposure(id: number, isExposed: boolean, adminMemo?: string) {
  const data: Partial<Exhibition> = {
    is_exposed: isExposed,
    updated_at: new Date().toISOString()
  }
  
  if (adminMemo !== undefined) {
    data.admin_memo = adminMemo
  }

  return await executeSupabaseQuery('exhibitions', 'update', {
    data,
    filters: { id }
  })
}

/**
 * 전시/공연 삭제
 */
export async function deleteExhibition(id: number) {
  return await executeSupabaseQuery('exhibitions', 'delete', {
    filters: { id }
  })
}

/**
 * 카테고리별 전시/공연 개수 조회
 */
export async function getExhibitionCountByCategory() {
  // Supabase에서는 집계 함수를 직접 지원하지 않으므로 
  // 별도의 RPC 함수를 만들거나 클라이언트에서 처리해야 합니다.
  // 여기서는 기본 구현을 제공합니다.
  
  const result = await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    select: 'category_name',
    filters: { is_exposed: true }
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 그룹핑
  const categoryCount = result.data.reduce((acc, exhibition) => {
    const category = exhibition.category_name || '기타'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryList = Object.entries(categoryCount).map(([category, count]) => ({
    category_name: category,
    count
  }))

  return { data: categoryList, error: null }
}

/**
 * 진행 중인 전시/공연 조회
 */
export async function getOngoingExhibitions(limit: number = 10) {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식

  // Supabase에서는 복잡한 날짜 비교를 위해 RPC 함수를 사용하거나
  // 클라이언트에서 필터링해야 할 수 있습니다.
  const result = await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    select: 'id, title, category_name, cover_image_url, start_date, end_date, location_name, fetched_at',
    filters: { is_exposed: true },
    orderBy: { column: 'start_date', ascending: true },
    limit: limit * 2 // 여유분을 가져와서 클라이언트에서 필터링
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 진행 중인 전시 필터링
  const ongoingExhibitions = result.data.filter(exhibition => {
    if (!exhibition.start_date || !exhibition.end_date) return false
    return exhibition.start_date <= today && exhibition.end_date >= today
  }).slice(0, limit)

  return { data: ongoingExhibitions, error: null }
}

/**
 * 예정된 전시/공연 조회
 */
export async function getUpcomingExhibitions(limit: number = 10) {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식

  const result = await executeSupabaseQuery<Exhibition>('exhibitions', 'select', {
    select: 'id, title, category_name, cover_image_url, start_date, end_date, location_name, fetched_at',
    filters: { is_exposed: true },
    orderBy: { column: 'start_date', ascending: true },
    limit: limit * 2 // 여유분을 가져와서 클라이언트에서 필터링
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 예정된 전시 필터링
  const upcomingExhibitions = result.data.filter(exhibition => {
    if (!exhibition.start_date) return false
    return exhibition.start_date > today
  }).slice(0, limit)

  return { data: upcomingExhibitions, error: null }
}

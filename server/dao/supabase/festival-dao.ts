// server/dao/supabase/festival-dao.ts
import { executeSupabaseQuery, batchUpsert } from '~/server/utils/supabase'

export interface Festival {
  id?: number
  original_api_id: string
  title: string
  content_html: string
  source_url: string
  writer_name: string
  written_date: string
  files_info: any
  api_raw_data: any
  is_exposed: boolean
  admin_memo?: string
  fetched_at?: string
  created_at?: string
  updated_at?: string
}

export interface GetFestivalsOptions {
  page?: number
  limit?: number
  searchTerm?: string
  isExposed?: string
  writerName?: string
  startDate?: string
  endDate?: string
}

/**
 * 축제 목록 조회 (페이징 지원)
 */
export async function getFestivals(options: GetFestivalsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    isExposed = '',
    writerName = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = {}

  // 필터 조건 설정
  if (isExposed === 'true') filters.is_exposed = true
  if (isExposed === 'false') filters.is_exposed = false
  if (writerName) filters.writer_name = `%${writerName}%`
  if (searchTerm) filters.title = `%${searchTerm}%`

  return await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'id, original_api_id, title, writer_name, written_date, is_exposed, fetched_at',
    filters,
    orderBy: { column: 'written_date', ascending: false },
    limit,
    offset
  })
}

/**
 * 축제 총 개수 조회
 */
export async function getFestivalsCount(options: GetFestivalsOptions = {}) {
  const {
    searchTerm = '',
    isExposed = '',
    writerName = ''
  } = options

  const filters: Record<string, any> = {}

  // 필터 조건 설정
  if (isExposed === 'true') filters.is_exposed = true
  if (isExposed === 'false') filters.is_exposed = false
  if (writerName) filters.writer_name = `%${writerName}%`
  if (searchTerm) filters.title = `%${searchTerm}%`

  const result = await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'id',
    filters
  })

  return result.count || 0
}

/**
 * 공개된 축제 목록 조회 (공개 API용)
 */
export async function getPublicFestivals(options: GetFestivalsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = { is_exposed: true }

  if (searchTerm) filters.title = `%${searchTerm}%`

  return await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'id, title, content_html, source_url, writer_name, written_date, files_info, fetched_at',
    filters,
    orderBy: { column: 'written_date', ascending: false },
    limit,
    offset
  })
}

/**
 * 특정 축제 상세 정보 조회
 */
export async function getFestivalById(id: number) {
  const result = await executeSupabaseQuery<Festival>('festivals', 'select', {
    filters: { id }
  })

  return result.data?.[0] || null
}

/**
 * 공개된 축제 상세 정보 조회 (공개 API용)
 */
export async function getPublicFestivalById(id: number) {
  const result = await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'id, title, content_html, source_url, writer_name, written_date, files_info, fetched_at',
    filters: { id, is_exposed: true }
  })

  return result.data?.[0] || null
}

/**
 * original_api_id로 축제 조회
 */
export async function getFestivalByOriginalApiId(original_api_id: string) {
  const result = await executeSupabaseQuery<Festival>('festivals', 'select', {
    filters: { original_api_id }
  })

  return result.data?.[0] || null
}

/**
 * 축제 정보 삽입/업데이트 (upsert)
 */
export async function upsertFestival(festival: Festival) {
  const data = {
    ...festival,
    // JSON 데이터는 Supabase에서 자동으로 처리됩니다
    files_info: typeof festival.files_info === 'string'
      ? JSON.parse(festival.files_info)
      : festival.files_info,
    api_raw_data: typeof festival.api_raw_data === 'string'
      ? JSON.parse(festival.api_raw_data)
      : festival.api_raw_data,
    fetched_at: festival.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('festivals', 'upsert', {
    data,
    onConflict: 'original_api_id' // original_api_id 기준으로 업데이트
  })
}

/**
 * 여러 축제 정보 배치 삽입/업데이트
 */
export async function batchUpsertFestivals(festivals: Festival[]) {
  const data = festivals.map(festival => ({
    ...festival,
    files_info: typeof festival.files_info === 'string'
      ? JSON.parse(festival.files_info)
      : festival.files_info,
    api_raw_data: typeof festival.api_raw_data === 'string'
      ? JSON.parse(festival.api_raw_data)
      : festival.api_raw_data,
    fetched_at: festival.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return await batchUpsert('festivals', data, 1000, 'original_api_id')
}

/**
 * 축제 노출 상태 업데이트
 */
export async function updateFestivalExposure(id: number, isExposed: boolean, adminMemo?: string) {
  const data: Partial<Festival> = {
    is_exposed: isExposed,
    updated_at: new Date().toISOString()
  }

  if (adminMemo !== undefined) {
    data.admin_memo = adminMemo
  }

  return await executeSupabaseQuery('festivals', 'update', {
    data,
    filters: { id }
  })
}

/**
 * 축제 삭제
 */
export async function deleteFestival(id: number) {
  return await executeSupabaseQuery('festivals', 'delete', {
    filters: { id }
  })
}

/**
 * 최근 축제 조회
 */
export async function getRecentFestivals(limit: number = 10) {
  return await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'id, title, content_html, writer_name, written_date, fetched_at',
    filters: { is_exposed: true },
    orderBy: { column: 'written_date', ascending: false },
    limit
  })
}

/**
 * 작성자별 축제 개수 조회
 */
export async function getFestivalCountByWriter() {
  const result = await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'writer_name',
    filters: { is_exposed: true }
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 그룹핑
  const writerCount = result.data.reduce((acc, festival) => {
    const writer = festival.writer_name || '알 수 없음'
    acc[writer] = (acc[writer] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const writerList = Object.entries(writerCount).map(([writer_name, count]) => ({
    writer_name,
    count
  }))

  return { data: writerList, error: null }
}

/**
 * 축제 검색 (제목 및 내용)
 */
export async function searchFestivals(searchTerm: string, limit: number = 20) {
  // Supabase에서는 전문 검색을 위해 별도의 설정이 필요할 수 있습니다.
  // 여기서는 기본적인 LIKE 검색을 사용합니다.

  const titleResult = await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'id, title, content_html, writer_name, written_date, fetched_at',
    filters: {
      is_exposed: true,
      title: `%${searchTerm}%`
    },
    orderBy: { column: 'written_date', ascending: false },
    limit: Math.floor(limit / 2)
  })

  const contentResult = await executeSupabaseQuery<Festival>('festivals', 'select', {
    select: 'id, title, content_html, writer_name, written_date, fetched_at',
    filters: {
      is_exposed: true,
      content_html: `%${searchTerm}%`
    },
    orderBy: { column: 'written_date', ascending: false },
    limit: Math.floor(limit / 2)
  })

  // 결과 합치기 및 중복 제거
  const allResults = [
    ...(titleResult.data || []),
    ...(contentResult.data || [])
  ]

  const uniqueResults = allResults.filter((festival, index, self) =>
    index === self.findIndex(f => f.id === festival.id)
  ).slice(0, limit)

  return {
    data: uniqueResults,
    error: titleResult.error || contentResult.error
  }
}

// server/dao/supabase/gas-station-dao.ts
import { executeSupabaseQuery, batchUpsert } from '~/server/utils/supabase'

export interface GasStation {
  id?: number
  opinet_id: string
  station_name: string
  brand_code?: string
  brand_name?: string
  gas_brand_code?: string
  gas_brand_name?: string
  zip_code?: string
  address?: string
  phone?: string
  station_type?: 'N' | 'Y' | 'C'
  katec_x?: number
  katec_y?: number
  latitude?: number
  longitude?: number
  api_raw_data?: string
  is_exposed?: boolean
  admin_memo?: string
  fetched_at?: string
  created_at?: string
  updated_at?: string
}

export interface GasPrice {
  id?: number
  opinet_id: string
  gasoline_price?: number
  premium_gasoline_price?: number
  diesel_price?: number
  lpg_price?: number
  price_date?: string
  api_raw_data?: string
  fetched_at?: string
  created_at?: string
  updated_at?: string
}

export interface GetGasStationsOptions {
  page?: number
  limit?: number
  searchTerm?: string
  isExposed?: string
  brandCode?: string
  stationType?: string
  latitude?: number
  longitude?: number
  radius?: number // km
}

/**
 * 주유소 목록 조회 (페이징 지원)
 */
export async function getGasStations(options: GetGasStationsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    isExposed = '',
    brandCode = '',
    stationType = ''
  } = options

  const offset = (page - 1) * limit
  const filters: Record<string, any> = {}

  // 필터 조건 설정
  if (isExposed === 'true') filters.is_exposed = true
  if (isExposed === 'false') filters.is_exposed = false
  if (brandCode) filters.brand_code = brandCode
  if (stationType) filters.station_type = stationType
  if (searchTerm) filters.station_name = `%${searchTerm}%`

  return await executeSupabaseQuery<GasStation>('gas_stations', 'select', {
    select: 'id, opinet_id, station_name, brand_code, brand_name, address, phone, station_type, latitude, longitude, is_exposed, fetched_at',
    filters,
    orderBy: { column: 'station_name', ascending: true },
    limit,
    offset
  })
}

/**
 * 특정 주유소 상세 정보 조회
 */
export async function getGasStationById(id: number) {
  const result = await executeSupabaseQuery<GasStation>('gas_stations', 'select', {
    filters: { id }
  })

  return result.data?.[0] || null
}

/**
 * opinet_id로 주유소 조회
 */
export async function getGasStationByOpinetId(opinet_id: string) {
  const result = await executeSupabaseQuery<GasStation>('gas_stations', 'select', {
    filters: { opinet_id }
  })

  return result.data?.[0] || null
}

/**
 * 주유소 정보 삽입/업데이트 (upsert)
 */
export async function upsertGasStation(gasStation: GasStation) {
  const data = {
    ...gasStation,
    fetched_at: gasStation.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('gas_stations', 'upsert', { data })
}

/**
 * 여러 주유소 정보 배치 삽입/업데이트
 */
export async function batchUpsertGasStations(gasStations: GasStation[]) {
  const data = gasStations.map(station => ({
    ...station,
    fetched_at: station.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return await batchUpsert('gas_stations', data)
}

/**
 * 주유소 노출 상태 업데이트
 */
export async function updateGasStationExposure(id: number, isExposed: boolean, adminMemo?: string) {
  const data: Partial<GasStation> = {
    is_exposed: isExposed,
    updated_at: new Date().toISOString()
  }

  if (adminMemo !== undefined) {
    data.admin_memo = adminMemo
  }

  return await executeSupabaseQuery('gas_stations', 'update', {
    data,
    filters: { id }
  })
}

/**
 * 주유소 가격 정보 조회
 */
export async function getGasPrices(opinet_id: string, limit: number = 30) {
  return await executeSupabaseQuery<GasPrice>('gas_prices', 'select', {
    filters: { opinet_id },
    orderBy: { column: 'price_date', ascending: false },
    limit
  })
}

/**
 * 주유소 가격 정보 삽입/업데이트
 */
export async function upsertGasPrice(gasPrice: GasPrice) {
  const data = {
    ...gasPrice,
    fetched_at: gasPrice.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return await executeSupabaseQuery('gas_prices', 'upsert', { data })
}

/**
 * 여러 주유소 가격 정보 배치 삽입/업데이트
 */
export async function batchUpsertGasPrices(gasPrices: GasPrice[]) {
  const data = gasPrices.map(price => ({
    ...price,
    fetched_at: price.fetched_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return await batchUpsert('gas_prices', data)
}

/**
 * 위치 기반 주유소 검색
 */
export async function getGasStationsByLocation(
  latitude: number,
  longitude: number,
  radius: number = 5, // km
  fuelType?: 'gasoline' | 'diesel' | 'lpg'
) {
  // Supabase에서는 PostGIS 확장을 사용하여 지리적 쿼리를 수행할 수 있습니다.
  // 여기서는 간단한 구현을 위해 기본 쿼리를 사용합니다.
  // 실제 운영에서는 PostGIS의 ST_DWithin 함수를 사용하는 것이 좋습니다.

  const result = await executeSupabaseQuery<GasStation>('gas_stations', 'select', {
    select: 'id, opinet_id, station_name, brand_code, brand_name, address, phone, latitude, longitude, is_exposed',
    filters: { is_exposed: true },
    orderBy: { column: 'station_name', ascending: true }
  })

  if (!result.data) return { data: [], error: result.error }

  // 클라이언트 사이드에서 거리 계산 (실제로는 PostGIS 사용 권장)
  const filteredStations = result.data.filter(station => {
    if (!station.latitude || !station.longitude) return false

    const distance = calculateDistance(
      latitude,
      longitude,
      station.latitude,
      station.longitude
    )

    return distance <= radius
  })

  return { data: filteredStations, error: null }
}

/**
 * 두 지점 간의 거리 계산 (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * 주유소 브랜드 목록 조회
 */
export async function getGasStationBrands() {
  return await executeSupabaseQuery('gas_station_brands', 'select', {
    orderBy: { column: 'brand_name', ascending: true }
  })
}

/**
 * 주유소와 가격 정보를 함께 조회 (기존 MySQL DAO 호환성)
 */
export async function getGasStationsWithPrices(options: GetGasStationsOptions = {}) {
  // 주유소 목록 조회
  const stationsResult = await getGasStations(options)

  if (stationsResult.error || !stationsResult.data) {
    return stationsResult
  }

  // 각 주유소의 최신 가격 정보 조회
  const stationsWithPrices = await Promise.all(
    stationsResult.data.map(async (station) => {
      const pricesResult = await getGasPrices(station.opinet_id, 1)
      const latestPrice = pricesResult.data?.[0] || null

      return {
        ...station,
        latest_price: latestPrice
      }
    })
  )

  return {
    data: stationsWithPrices,
    error: null,
    count: stationsResult.count
  }
}

/**
 * 모든 주유소의 노출 상태 업데이트
 */
export async function updateAllGasStationsExposure(isExposed: boolean) {
  // Supabase에서는 조건부 업데이트를 위해 먼저 조회 후 업데이트
  const result = await executeSupabaseQuery('gas_stations', 'select', {
    select: 'id',
    filters: { is_exposed: !isExposed }
  })

  if (result.data && result.data.length > 0) {
    const ids = result.data.map(item => item.id)
    // 배치 업데이트는 Supabase에서 직접 지원하지 않으므로 개별 업데이트
    const updatePromises = ids.map(id =>
      executeSupabaseQuery('gas_stations', 'update', {
        data: { is_exposed: isExposed, updated_at: new Date().toISOString() },
        filters: { id }
      })
    )

    return await Promise.all(updatePromises)
  }

  return []
}

/**
 * 주유소 총 개수 조회
 */
export async function getGasStationsCount(options: GetGasStationsOptions = {}) {
  const {
    searchTerm = '',
    isExposed = '',
    fuelType = ''
  } = options

  const filters: Record<string, any> = {}

  // 필터 조건 설정
  if (isExposed === 'true') filters.is_exposed = true
  if (isExposed === 'false') filters.is_exposed = false
  if (searchTerm) filters.station_name = `%${searchTerm}%`

  const result = await executeSupabaseQuery<GasStation>('gas_stations', 'select', {
    select: 'id',
    filters
  })

  return result.count || 0
}

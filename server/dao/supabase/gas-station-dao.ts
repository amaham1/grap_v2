// server/dao/supabase/gas-station-dao.ts
import { executeSupabaseQuery, batchUpsert, supabase } from '~/server/utils/supabase'

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

  console.log('🔍 [QUERY-DEBUG] Supabase 쿼리 실행:', {
    table: 'gas_stations',
    operation: 'select',
    page,
    limit,
    offset,
    filters,
    searchTerm,
    brandCode,
    stationType,
    isExposed,
    timestamp: new Date().toISOString()
  });

  const queryStartTime = Date.now();
  const result = await executeSupabaseQuery<GasStation>('gas_stations', 'select', {
    select: 'id, opinet_id, station_name, brand_code, brand_name, address, phone, station_type, latitude, longitude, is_exposed, fetched_at',
    filters,
    orderBy: { column: 'station_name', ascending: true },
    limit,
    offset
  });

  console.log('🔍 [QUERY-RESULT-DEBUG] Supabase 쿼리 결과:', {
    success: !result.error,
    dataCount: result.data?.length || 0,
    totalCount: result.count || 0,
    error: result.error?.message || null,
    queryTime: Date.now() - queryStartTime + 'ms',
    hasCoordinates: result.data?.filter(s => s.latitude && s.longitude).length || 0,
    exposedCount: result.data?.filter(s => s.is_exposed).length || 0
  });

  return result;
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

  return await executeSupabaseQuery('gas_stations', 'upsert', {
    data,
    onConflict: 'opinet_id' // opinet_id 기준으로 업데이트
  })
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

  return await batchUpsert('gas_stations', data, 100, 'opinet_id') // Cloudflare Workers 최적화를 위해 배치 크기 더 감소
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
 * 여러 주유소의 최신 가격 정보를 배치로 조회 (Cloudflare Workers subrequest 제한 해결)
 */
export async function getBatchLatestGasPrices(opinet_ids: string[]) {
  const startTime = Date.now();

  console.log('🔥 [BATCH-PRICE-DEBUG] 배치 가격 조회 시작:', {
    opinet_ids_count: opinet_ids.length,
    opinet_ids_sample: opinet_ids.slice(0, 5),
    timestamp: new Date().toISOString()
  });

  if (opinet_ids.length === 0) {
    return { data: [], error: null };
  }

  // IN 절 필터링을 위해 직접 supabase 클라이언트 사용
  try {
    const batchResult = await supabase
      .from('gas_prices')
      .select('*')
      .in('opinet_id', opinet_ids)
      .order('price_date', { ascending: false });

    if (batchResult.error) {
      console.error('🔥 [BATCH-PRICE-ERROR] 배치 가격 조회 실패:', batchResult.error);
      return { data: [], error: batchResult.error };
    }

    // 각 주유소별로 최신 가격만 필터링
    const latestPricesMap = new Map<string, any>();

    if (batchResult.data) {
      batchResult.data.forEach(price => {
        const existing = latestPricesMap.get(price.opinet_id);
        if (!existing || new Date(price.price_date) > new Date(existing.price_date)) {
          latestPricesMap.set(price.opinet_id, price);
        }
      });
    }

    const latestPrices = Array.from(latestPricesMap.values());

    console.log('🔥 [BATCH-PRICE-DEBUG] 배치 가격 조회 완료:', {
      requested_count: opinet_ids.length,
      total_prices_found: batchResult.data?.length || 0,
      latest_prices_count: latestPrices.length,
      success_rate: `${Math.round((latestPrices.length / opinet_ids.length) * 100)}%`,
      queryTime: Date.now() - startTime + 'ms'
    });

    return { data: latestPrices, error: null };
  } catch (error) {
    console.error('🔥 [BATCH-PRICE-ERROR] 배치 가격 조회 예외:', error);
    return { data: [], error };
  }
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

  return await executeSupabaseQuery('gas_prices', 'upsert', {
    data,
    onConflict: 'opinet_id,price_date' // opinet_id와 price_date 복합키 기준으로 업데이트
  })
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

  return await batchUpsert('gas_prices', data, 100, 'opinet_id,price_date') // Cloudflare Workers 최적화를 위해 배치 크기 더 감소
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
 * 주유소와 가격 정보를 함께 조회 (기존 MySQL DAO 호환성) - 배치 최적화 버전
 */
export async function getGasStationsWithPrices(options: GetGasStationsOptions = {}) {
  const startTime = Date.now();

  console.log('🗃️ [DAO-DEBUG] getGasStationsWithPrices 시작 (배치 최적화):', {
    options,
    timestamp: new Date().toISOString()
  });

  // 주유소 목록 조회
  console.log('📋 [DAO-DEBUG] 주유소 목록 조회 시작...');
  const stationsResult = await getGasStations(options)

  console.log('📋 [DAO-DEBUG] 주유소 목록 조회 완료:', {
    success: !stationsResult.error,
    dataCount: stationsResult.data?.length || 0,
    totalCount: stationsResult.count || 0,
    error: stationsResult.error?.message || null,
    queryTime: Date.now() - startTime + 'ms'
  });

  if (stationsResult.error || !stationsResult.data) {
    console.error('❌ [DAO-ERROR] 주유소 목록 조회 실패:', stationsResult.error);
    return stationsResult
  }

  // 모든 주유소의 opinet_id 수집
  const opinet_ids = stationsResult.data.map(station => station.opinet_id);

  console.log('💰 [DAO-DEBUG] 배치 가격 정보 조회 시작:', {
    stationCount: stationsResult.data.length,
    opinet_ids_sample: opinet_ids.slice(0, 5)
  });

  const priceStartTime = Date.now();

  // 배치로 모든 주유소의 최신 가격 정보 조회 (단일 쿼리)
  const batchPricesResult = await getBatchLatestGasPrices(opinet_ids);

  if (batchPricesResult.error) {
    console.error('❌ [BATCH-PRICE-ERROR] 배치 가격 조회 실패:', batchPricesResult.error);
    // 가격 정보 없이 주유소 정보만 반환
    const stationsWithoutPrices = stationsResult.data.map(station => ({
      ...station,
      latest_price: null
    }));

    return {
      data: stationsWithoutPrices,
      error: null,
      count: stationsResult.count
    };
  }

  // 가격 정보를 opinet_id로 매핑
  const pricesMap = new Map<string, any>();
  if (batchPricesResult.data) {
    batchPricesResult.data.forEach(price => {
      pricesMap.set(price.opinet_id, price);
    });
  }

  // 주유소와 가격 정보 결합
  const stationsWithPrices = stationsResult.data.map((station, index) => {
    const latestPrice = pricesMap.get(station.opinet_id) || null;

    // 처음 5개 주유소의 가격 정보 상세 로그
    if (index < 5) {
      console.log(`💰 [PRICE-DETAIL-DEBUG] ${index + 1}. ${station.station_name} (${station.opinet_id}):`, {
        hasPrice: !!latestPrice,
        gasoline: latestPrice?.gasoline_price || null,
        diesel: latestPrice?.diesel_price || null,
        lpg: latestPrice?.lpg_price || null,
        priceDate: latestPrice?.price_date || null
      });
    }

    return {
      ...station,
      latest_price: latestPrice
    };
  });

  const priceSuccessCount = stationsWithPrices.filter(s => s.latest_price).length;
  const priceFailCount = stationsWithPrices.length - priceSuccessCount;

  console.log('💰 [DAO-DEBUG] 배치 가격 정보 조회 완료:', {
    totalStations: stationsResult.data.length,
    priceSuccessCount,
    priceFailCount,
    successRate: `${Math.round((priceSuccessCount / stationsResult.data.length) * 100)}%`,
    priceQueryTime: Date.now() - priceStartTime + 'ms',
    totalTime: Date.now() - startTime + 'ms'
  });

  const finalResult = {
    data: stationsWithPrices,
    error: null,
    count: stationsResult.count
  };

  console.log('🎯 [DAO-DEBUG] getGasStationsWithPrices 완료 (배치 최적화):', {
    finalDataCount: finalResult.data.length,
    finalTotalCount: finalResult.count,
    totalProcessingTime: Date.now() - startTime + 'ms'
  });

  return finalResult;
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

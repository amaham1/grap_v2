// server/dao/gas-station-dao.ts
import mysql from 'mysql2/promise';
import { executeQuery } from '~/server/utils/db';
import proj4 from 'proj4';

export interface GasStation {
  id?: number;
  opinet_id: string;
  station_name: string;
  brand_code?: string;
  brand_name?: string;
  gas_brand_code?: string;
  gas_brand_name?: string;
  zip_code?: string;
  address?: string;
  phone?: string;
  station_type?: 'N' | 'Y' | 'C';
  katec_x?: number;
  katec_y?: number;
  latitude?: number;
  longitude?: number;
  api_raw_data?: any;
  is_exposed?: boolean;
  admin_memo?: string;
  fetched_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface GasPrice {
  id?: number;
  opinet_id: string;
  gasoline_price?: number;
  premium_gasoline_price?: number;
  diesel_price?: number;
  lpg_price?: number;
  price_date?: Date;
  api_raw_data?: any;
  fetched_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface GasStationWithPrices extends GasStation {
  current_prices?: GasPrice;
}

// 정확한 TM128 좌표계 정의 (제주도 API에서 사용)
const TM128_PROJ = '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43';

// WGS84 좌표계 정의
const WGS84_PROJ = '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs';

// 기타 한국 TM 좌표계들 (백업용)
const EPSG_5179_PROJ = '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs';
const EPSG_5181_PROJ = '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs';

/**
 * 카텍 좌표를 WGS84 좌표로 변환
 * proj4 라이브러리를 사용한 정확한 좌표 변환
 */
function convertKatecToWgs84(katecX: number, katecY: number): { latitude: number; longitude: number } {
  // 여러 좌표계를 시도해보기 (TM128을 우선적으로 시도)
  const projections = [
    { name: 'TM128', proj: TM128_PROJ },
    { name: 'EPSG:5179', proj: EPSG_5179_PROJ },
    { name: 'EPSG:5181', proj: EPSG_5181_PROJ }
  ];

  for (const projection of projections) {
    try {
      const result = proj4(projection.proj, WGS84_PROJ, [katecX, katecY]);

      const converted = {
        longitude: result[0], // 경도
        latitude: result[1]   // 위도
      };

      // 제주도 범위 내인지 확인 (위도: 33.1~33.6, 경도: 126.1~126.9)
      if (converted.latitude >= 33.0 && converted.latitude <= 34.0 &&
          converted.longitude >= 126.0 && converted.longitude <= 127.0) {

        // 변환 결과 로그 (처음 몇 개만)
        if (Math.random() < 0.05) { // 5% 확률로 로그 출력
          console.log(`[COORD] 좌표 변환 성공 (${projection.name}): KATEC(${katecX}, ${katecY}) → WGS84(${converted.latitude.toFixed(6)}, ${converted.longitude.toFixed(6)})`);
        }

        return converted;
      }
    } catch (error) {
      // 이 좌표계로는 변환 실패, 다음 시도
      continue;
    }
  }

  // 모든 좌표계 변환 실패 시 제주도 특화 근사 변환 시도
  console.warn(`모든 좌표계 변환 실패, 제주도 특화 근사 변환 시도: KATEC(${katecX}, ${katecY})`);

  // 제주도 API 좌표계 분석 기반 변환
  // 실제 데이터 분석: 고산주유소 KATEC(230647.3597, 79911.38277) ≈ WGS84(33.31, 126.16)
  // 제주공항 근처 주유소들의 좌표 패턴 분석 결과

  // X 좌표 (경도) 변환: KATEC X 200000~300000 → WGS84 경도 126.0~126.9
  const longitude = 126.0 + (katecX - 200000) / 100000 * 0.9;

  // Y 좌표 (위도) 변환: KATEC Y 50000~150000 → WGS84 위도 33.1~33.6
  const latitude = 33.1 + (katecY - 50000) / 100000 * 0.5;

  // 제주도 범위 내로 제한
  const clampedLongitude = Math.max(126.0, Math.min(127.0, longitude));
  const clampedLatitude = Math.max(33.0, Math.min(34.0, latitude));

  // 변환 결과 로그
  if (Math.random() < 0.1) { // 10% 확률로 로그 출력 (근사 변환이므로 더 자주)
    console.log(`[COORD] 제주도 근사 변환: KATEC(${katecX}, ${katecY}) → WGS84(${clampedLatitude.toFixed(6)}, ${clampedLongitude.toFixed(6)})`);
  }

  return {
    latitude: clampedLatitude,
    longitude: clampedLongitude
  };
}

/**
 * 브랜드 코드를 브랜드명으로 변환
 */
function getBrandName(brandCode: string): string {
  const brandMap: { [key: string]: string } = {
    'SKE': 'SK에너지',
    'GSC': 'GS칼텍스',
    'SOL': 'S-OIL',
    'HDO': '현대오일뱅크',
    'RTO': '자영알뜰',
    'RTX': '고속도로(EX)알뜰',
    'NHO': '농협(NH)알뜰',
    'ETC': '자가상표',
    'NCO': '자가상표',
    'SKG': 'SK가스',
    'E1G': 'E1'
  };

  return brandMap[brandCode] || brandCode;
}

/**
 * 주유소 정보를 bulk upsert합니다.
 */
export async function bulkUpsertGasStations(connection: mysql.Connection, gasStations: GasStation[]): Promise<{ newCount: number; updatedCount: number }> {
  if (gasStations.length === 0) {
    return { newCount: 0, updatedCount: 0 };
  }

  const now = new Date();

  // 좌표 변환 및 데이터 준비
  const processedStations = gasStations.map(gasStation => {
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (gasStation.katec_x && gasStation.katec_y) {
      const converted = convertKatecToWgs84(gasStation.katec_x, gasStation.katec_y);
      latitude = converted.latitude;
      longitude = converted.longitude;
    }

    // 브랜드명 매핑
    const brandName = gasStation.brand_code ? getBrandName(gasStation.brand_code) : '';
    const gasBrandName = gasStation.gas_brand_code ? getBrandName(gasStation.gas_brand_code) : '';

    return {
      ...gasStation,
      brand_name: brandName,
      gas_brand_name: gasBrandName,
      latitude,
      longitude,
      fetched_at: now,
      updated_at: now
    };
  });

  // MySQL의 ON DUPLICATE KEY UPDATE를 사용한 bulk upsert
  const insertQuery = `
    INSERT INTO gas_stations (
      opinet_id, station_name, brand_code, brand_name, gas_brand_code, gas_brand_name,
      zip_code, address, phone, station_type, katec_x, katec_y, latitude, longitude,
      api_raw_data, is_exposed, fetched_at, created_at, updated_at
    ) VALUES ${processedStations.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
    ON DUPLICATE KEY UPDATE
      station_name = VALUES(station_name),
      brand_code = VALUES(brand_code),
      brand_name = VALUES(brand_name),
      gas_brand_code = VALUES(gas_brand_code),
      gas_brand_name = VALUES(gas_brand_name),
      zip_code = VALUES(zip_code),
      address = VALUES(address),
      phone = VALUES(phone),
      station_type = VALUES(station_type),
      katec_x = VALUES(katec_x),
      katec_y = VALUES(katec_y),
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      api_raw_data = VALUES(api_raw_data),
      fetched_at = VALUES(fetched_at),
      updated_at = VALUES(updated_at)`;

  const values: any[] = [];
  processedStations.forEach(station => {
    values.push(
      station.opinet_id,
      station.station_name,
      station.brand_code,
      station.brand_name,
      station.gas_brand_code,
      station.gas_brand_name,
      station.zip_code,
      station.address,
      station.phone,
      station.station_type,
      station.katec_x,
      station.katec_y,
      station.latitude,
      station.longitude,
      JSON.stringify(station.api_raw_data),
      1, // is_exposed = 1
      station.fetched_at,
      now, // created_at (only for new records)
      station.updated_at
    );
  });

  const result = await connection.execute(insertQuery, values);
  const affectedRows = (result[0] as any).affectedRows;
  const changedRows = (result[0] as any).changedRows;

  // MySQL의 ON DUPLICATE KEY UPDATE에서:
  // - 새로 삽입된 경우: affectedRows = 1
  // - 업데이트된 경우: affectedRows = 2
  // - 변경사항이 없는 경우: affectedRows = 0
  const newCount = Math.max(0, affectedRows - changedRows);
  const updatedCount = changedRows;

  return { newCount, updatedCount };
}

/**
 * 주유소 가격 정보를 bulk upsert합니다.
 */
export async function bulkUpsertGasPrices(connection: mysql.Connection, gasPrices: GasPrice[]): Promise<{ newCount: number; updatedCount: number }> {
  if (gasPrices.length === 0) {
    return { newCount: 0, updatedCount: 0 };
  }

  const now = new Date();

  // 데이터 준비
  const processedPrices = gasPrices.map(gasPrice => ({
    ...gasPrice,
    price_date: gasPrice.price_date || now,
    fetched_at: now,
    updated_at: now
  }));

  // MySQL의 ON DUPLICATE KEY UPDATE를 사용한 bulk upsert
  const insertQuery = `
    INSERT INTO gas_prices (
      opinet_id, gasoline_price, premium_gasoline_price, diesel_price, lpg_price,
      price_date, api_raw_data, fetched_at, created_at, updated_at
    ) VALUES ${processedPrices.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
    ON DUPLICATE KEY UPDATE
      gasoline_price = VALUES(gasoline_price),
      premium_gasoline_price = VALUES(premium_gasoline_price),
      diesel_price = VALUES(diesel_price),
      lpg_price = VALUES(lpg_price),
      api_raw_data = VALUES(api_raw_data),
      fetched_at = VALUES(fetched_at),
      updated_at = VALUES(updated_at)`;

  const values: any[] = [];
  processedPrices.forEach(price => {
    values.push(
      price.opinet_id,
      price.gasoline_price || 0,
      price.premium_gasoline_price || 0,
      price.diesel_price || 0,
      price.lpg_price || 0,
      price.price_date,
      JSON.stringify(price.api_raw_data),
      price.fetched_at,
      now, // created_at (only for new records)
      price.updated_at
    );
  });

  const result = await connection.execute(insertQuery, values);
  const affectedRows = (result[0] as any).affectedRows;
  const changedRows = (result[0] as any).changedRows;

  const newCount = Math.max(0, affectedRows - changedRows);
  const updatedCount = changedRows;

  return { newCount, updatedCount };
}

/**
 * 주유소 정보를 upsert합니다. (기존 함수 - 호환성 유지)
 */
export async function upsertGasStation(connection: mysql.Connection, gasStation: GasStation): Promise<{ id: number; isNew: boolean }> {
  const now = new Date();

  // 좌표 변환
  let latitude: number | undefined;
  let longitude: number | undefined;

  if (gasStation.katec_x && gasStation.katec_y) {
    const converted = convertKatecToWgs84(gasStation.katec_x, gasStation.katec_y);
    latitude = converted.latitude;
    longitude = converted.longitude;
  }

  // 브랜드명 설정
  const brandName = gasStation.brand_code ? getBrandName(gasStation.brand_code) : undefined;
  const gasBrandName = gasStation.gas_brand_code ? getBrandName(gasStation.gas_brand_code) : undefined;

  // 기존 데이터 확인
  const existingQuery = 'SELECT id FROM gas_stations WHERE opinet_id = ?';
  const existing = await connection.execute(existingQuery, [gasStation.opinet_id]);
  const existingRows = existing[0] as any[];

  if (existingRows.length > 0) {
    // 업데이트
    const id = existingRows[0].id;
    const updateQuery = `
      UPDATE gas_stations SET
        station_name = ?, brand_code = ?, brand_name = ?, gas_brand_code = ?, gas_brand_name = ?,
        zip_code = ?, address = ?, phone = ?, station_type = ?,
        katec_x = ?, katec_y = ?, latitude = ?, longitude = ?,
        api_raw_data = ?, fetched_at = ?, updated_at = ?
      WHERE opinet_id = ?`;

    await connection.execute(updateQuery, [
      gasStation.station_name,
      gasStation.brand_code,
      brandName,
      gasStation.gas_brand_code,
      gasBrandName,
      gasStation.zip_code,
      gasStation.address,
      gasStation.phone,
      gasStation.station_type,
      gasStation.katec_x,
      gasStation.katec_y,
      latitude,
      longitude,
      JSON.stringify(gasStation.api_raw_data),
      now,
      now,
      gasStation.opinet_id
    ]);

    return { id, isNew: false };
  } else {
    // 삽입
    const insertQuery = `
      INSERT INTO gas_stations (
        opinet_id, station_name, brand_code, brand_name, gas_brand_code, gas_brand_name,
        zip_code, address, phone, station_type, katec_x, katec_y, latitude, longitude,
        api_raw_data, is_exposed, fetched_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await connection.execute(insertQuery, [
      gasStation.opinet_id,
      gasStation.station_name,
      gasStation.brand_code,
      brandName,
      gasStation.gas_brand_code,
      gasBrandName,
      gasStation.zip_code,
      gasStation.address,
      gasStation.phone,
      gasStation.station_type,
      gasStation.katec_x,
      gasStation.katec_y,
      latitude,
      longitude,
      JSON.stringify(gasStation.api_raw_data),
      1, // 항상 노출함 (is_exposed = 1)
      now,
      now,
      now
    ]);

    const insertId = (result[0] as any).insertId;
    return { id: insertId, isNew: true };
  }
}

/**
 * 주유소 가격 정보를 upsert합니다.
 */
export async function upsertGasPrice(connection: mysql.Connection, gasPrice: GasPrice): Promise<{ id: number; isNew: boolean }> {
  const now = new Date();
  const priceDate = gasPrice.price_date || now;

  // 기존 데이터 확인 (같은 주유소, 같은 날짜)
  const existingQuery = 'SELECT id FROM gas_prices WHERE opinet_id = ? AND price_date = ?';
  const existing = await connection.execute(existingQuery, [gasPrice.opinet_id, priceDate]);
  const existingRows = existing[0] as any[];

  if (existingRows.length > 0) {
    // 업데이트
    const id = existingRows[0].id;
    const updateQuery = `
      UPDATE gas_prices SET
        gasoline_price = ?, premium_gasoline_price = ?, diesel_price = ?, lpg_price = ?,
        api_raw_data = ?, fetched_at = ?, updated_at = ?
      WHERE id = ?`;

    await connection.execute(updateQuery, [
      gasPrice.gasoline_price || 0,
      gasPrice.premium_gasoline_price || 0,
      gasPrice.diesel_price || 0,
      gasPrice.lpg_price || 0,
      JSON.stringify(gasPrice.api_raw_data),
      now,
      now,
      id
    ]);

    return { id, isNew: false };
  } else {
    // 삽입
    const insertQuery = `
      INSERT INTO gas_prices (
        opinet_id, gasoline_price, premium_gasoline_price, diesel_price, lpg_price,
        price_date, api_raw_data, fetched_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await connection.execute(insertQuery, [
      gasPrice.opinet_id,
      gasPrice.gasoline_price || 0,
      gasPrice.premium_gasoline_price || 0,
      gasPrice.diesel_price || 0,
      gasPrice.lpg_price || 0,
      priceDate,
      JSON.stringify(gasPrice.api_raw_data),
      now,
      now,
      now
    ]);

    const insertId = (result[0] as any).insertId;
    return { id: insertId, isNew: true };
  }
}

/**
 * 주유소 목록을 조회합니다 (가격 정보 포함).
 */
export async function getGasStationsWithPrices(
  page: number = 1,
  pageSize: number = 20,
  searchQuery?: string,
  brandCode?: string,
  stationType?: string
): Promise<{ items: GasStationWithPrices[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const params: any[] = [];

  // 디버깅: 전체 주유소 개수 확인
  const totalCountQuery = 'SELECT COUNT(*) as total FROM gas_stations';
  const totalCountResult = await executeQuery<any[]>(totalCountQuery, []);
  console.log(`[DEBUG] 전체 gas_stations 테이블 레코드 수: ${totalCountResult[0].total}`);

  // 디버깅: is_exposed=true인 주유소 개수 확인
  const exposedCountQuery = 'SELECT COUNT(*) as total FROM gas_stations WHERE is_exposed = true';
  const exposedCountResult = await executeQuery<any[]>(exposedCountQuery, []);
  console.log(`[DEBUG] is_exposed=true인 주유소 수: ${exposedCountResult[0].total}`);

  // is_exposed=true 조건 적용
  console.log(`[DEBUG] is_exposed=true 조건으로 주유소 데이터 조회`);
  const whereClauses: string[] = ['gs.is_exposed = true'];

  if (searchQuery) {
    whereClauses.push('(gs.station_name LIKE ? OR gs.address LIKE ?)');
    params.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  if (brandCode) {
    whereClauses.push('gs.brand_code = ?');
    params.push(brandCode);
  }

  if (stationType) {
    whereClauses.push('gs.station_type = ?');
    params.push(stationType);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM gas_stations gs
    ${whereClause}`;
  const countResult = await executeQuery<any[]>(countQuery, params);

  const query = `
    SELECT
      gs.*,
      gp.gasoline_price,
      gp.premium_gasoline_price,
      gp.diesel_price,
      gp.lpg_price,
      gp.price_date
    FROM gas_stations gs
    LEFT JOIN gas_prices gp ON gs.opinet_id = gp.opinet_id
      AND gp.price_date = (
        SELECT MAX(price_date)
        FROM gas_prices
        WHERE opinet_id = gs.opinet_id
      )
    ${whereClause}
    ORDER BY gs.station_name ASC
    LIMIT ? OFFSET ?`;

  const items = await executeQuery<any[]>(query, [...params, pageSize, offset]);

  // 데이터 구조 정리
  const gasStations: GasStationWithPrices[] = items.map(item => ({
    id: item.id,
    opinet_id: item.opinet_id,
    station_name: item.station_name,
    brand_code: item.brand_code,
    brand_name: item.brand_name,
    gas_brand_code: item.gas_brand_code,
    gas_brand_name: item.gas_brand_name,
    zip_code: item.zip_code,
    address: item.address,
    phone: item.phone,
    station_type: item.station_type,
    katec_x: item.katec_x,
    katec_y: item.katec_y,
    latitude: item.latitude,
    longitude: item.longitude,
    is_exposed: item.is_exposed,
    admin_memo: item.admin_memo,
    fetched_at: item.fetched_at,
    created_at: item.created_at,
    updated_at: item.updated_at,
    current_prices: item.gasoline_price !== null ? {
      gasoline_price: item.gasoline_price,
      premium_gasoline_price: item.premium_gasoline_price,
      diesel_price: item.diesel_price,
      lpg_price: item.lpg_price,
      price_date: item.price_date
    } : undefined
  }));

  return {
    items: gasStations,
    total: countResult[0].total
  };
}

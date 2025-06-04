// utils/gasStationUtils.ts
import type { GasStation, FuelType, FavoriteStation } from '~/types/gasStation';
import proj4 from 'proj4';

// 연료 타입 옵션
export const fuelTypes: FuelType[] = [
  { value: '', label: '전체' },
  { value: 'gasoline', label: '휘발유' },
  { value: 'diesel', label: '경유' },
  { value: 'lpg', label: 'LPG' }
];

// 가격 포맷팅 함수
export const formatPrice = (price: number): string => {
  if (!price || price <= 0) return '정보없음';
  return price.toLocaleString();
};

// 주유소의 선택된 연료 가격 가져오기
export const getStationPrice = (station: GasStation, selectedFuel: string): number => {
  if (!station.prices) return 0;
  
  switch (selectedFuel) {
    case 'gasoline':
      return station.prices.gasoline || 0;
    case 'diesel':
      return station.prices.diesel || 0;
    case 'lpg':
      return station.prices.lpg || 0;
    default:
      return station.prices.gasoline || station.prices.diesel || station.prices.lpg || 0;
  }
};

// 좌표계 정의 - 제주도 지역 특화
// 제주도 API에서 사용하는 정확한 좌표계
// Y좌표 범위에 따라 다른 False Northing 값 사용
const COORDINATE_SYSTEMS = {
  // 제주도 전용 좌표계 (중앙경선 126.5도, False Northing 0)
  JEJU_126_5_Y0: '+proj=tmerc +lat_0=38 +lon_0=126.5 +k=1 +x_0=200000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
  // 제주도 전용 좌표계 (중앙경선 126.5도, False Northing 500000)
  JEJU_126_5_Y500: '+proj=tmerc +lat_0=38 +lon_0=126.5 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',
  // 제주도 전용 좌표계 (중앙경선 126.5도, False Northing 550000)
  JEJU_126_5_Y550: '+proj=tmerc +lat_0=38 +lon_0=126.5 +k=1 +x_0=200000 +y_0=550000 +ellps=GRS80 +units=m +no_defs',
  // 제주도 전용 좌표계 (중앙경선 126도, False Northing 0)
  JEJU_126_Y0: '+proj=tmerc +lat_0=38 +lon_0=126 +k=1 +x_0=200000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
  // 제주도 전용 좌표계 (중앙경선 126도, False Northing 500000)
  JEJU_126_Y500: '+proj=tmerc +lat_0=38 +lon_0=126 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs',
  // 제주도 전용 좌표계 (중앙경선 126도, False Northing 550000)
  JEJU_126_Y550: '+proj=tmerc +lat_0=38 +lon_0=126 +k=1 +x_0=200000 +y_0=550000 +ellps=GRS80 +units=m +no_defs',
  // Bessel 타원체 버전들
  JEJU_126_5_BESSEL_Y0: '+proj=tmerc +lat_0=38 +lon_0=126.5 +k=1 +x_0=200000 +y_0=0 +ellps=bessel +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43 +units=m +no_defs',
  JEJU_126_5_BESSEL_Y500: '+proj=tmerc +lat_0=38 +lon_0=126.5 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43 +units=m +no_defs',
  // 기존 좌표계들 (백업용)
  JEJU_CENTRAL: '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=550000 +ellps=GRS80 +units=m +no_defs',
  JEJU_ORIGIN: '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs'
};

const WGS84_PROJ = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

// Kakao API 설정
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || 'd806ae809740b6a6e114067f7326bd38';
const KAKAO_COORD_CONVERT_URL = 'https://dapi.kakao.com/v2/local/geo/transcoord.json';

// 좌표 변환 캐시 (메모리 기반, 세션 동안 유지)
const coordinateCache = new Map<string, { latitude: number; longitude: number } | null>();

/**
 * Kakao API를 사용하여 KATEC 좌표를 WGS84로 변환하는 함수
 * @param katecX KATEC X 좌표
 * @param katecY KATEC Y 좌표
 * @param timeout 타임아웃 시간 (밀리초, 기본값: 5000ms)
 * @returns WGS84 좌표 또는 null
 */
const convertWithKakaoAPI = async (katecX: number, katecY: number, timeout: number = 5000): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const requestStartTime = Date.now();
    console.log(`🗺️ [KAKAO-API] 좌표 변환 요청 시작: KATEC(${katecX}, ${katecY})`);

    const url = new URL(KAKAO_COORD_CONVERT_URL);
    url.searchParams.append('x', katecX.toString());
    url.searchParams.append('y', katecY.toString());
    url.searchParams.append('input_coord', 'KTM');
    url.searchParams.append('output_coord', 'WGS84');

    console.log(`📡 [KAKAO-API] 요청 URL: ${url.toString()}`);
    console.log(`🔑 [KAKAO-API] API 키: ${KAKAO_REST_API_KEY.substring(0, 10)}...`);
    console.log(`⏰ [KAKAO-API] 타임아웃 설정: ${timeout}ms`);

    // AbortController를 사용한 타임아웃 처리
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const requestDuration = Date.now() - requestStartTime;

    console.log(`📥 [KAKAO-API] 응답 수신: ${response.status} ${response.statusText} (${requestDuration}ms)`);

    if (!response.ok) {
      console.warn(`❌ [KAKAO-API] HTTP 오류: ${response.status} ${response.statusText}`);
      console.warn(`🔧 [KAKAO-API] 해결 방안:`);
      console.warn(`  1. API 키 유효성 확인: ${KAKAO_REST_API_KEY.substring(0, 10)}...`);
      console.warn(`  2. 카카오 API 서비스 상태 확인`);
      console.warn(`  3. 요청 제한 확인 (일일/월간 한도)`);
      console.warn(`  4. 네트워크 연결 상태 확인`);
      return null;
    }

    const data = await response.json();
    console.log(`📊 [KAKAO-API] 응답 데이터:`, {
      documentsCount: data.documents?.length || 0,
      meta: data.meta,
      hasResult: !!(data.documents && data.documents.length > 0)
    });

    if (data.documents && data.documents.length > 0) {
      const result = data.documents[0];
      const longitude = parseFloat(result.x);
      const latitude = parseFloat(result.y);

      console.log(`🔍 [KAKAO-API] 변환 결과 분석:`);
      console.log(`  📍 원본 KATEC: X=${katecX}, Y=${katecY}`);
      console.log(`  🌍 변환된 WGS84: 위도=${latitude.toFixed(6)}, 경도=${longitude.toFixed(6)}`);
      console.log(`  📏 정밀도: 소수점 6자리 (약 1m 정확도)`);

      // 제주도 영역 검증
      if (latitude >= 33.0 && latitude <= 33.8 && longitude >= 126.0 && longitude <= 128.2) {
        console.log(`✅ [KAKAO-API] 좌표 변환 성공! 제주도 영역 내 좌표 확인`);
        console.log(`🎯 [KAKAO-API] 최종 좌표: 위도=${latitude.toFixed(6)}, 경도=${longitude.toFixed(6)}`);

        return {
          latitude: Math.round(latitude * 1000000) / 1000000,
          longitude: Math.round(longitude * 1000000) / 1000000
        };
      } else {
        console.warn(`❌ [KAKAO-API] 제주도 영역 외부 좌표 감지`);
        console.warn(`  📍 변환된 좌표: 위도=${latitude.toFixed(6)}, 경도=${longitude.toFixed(6)}`);
        console.warn(`  🗺️ 제주도 영역: 위도 33.0~33.8, 경도 126.0~128.2`);
        console.warn(`  🔧 원인: 잘못된 KATEC 좌표 또는 좌표계 불일치`);
        return null;
      }
    } else {
      console.warn(`❌ [KAKAO-API] 변환 결과 없음`);
      console.warn(`  📍 입력 좌표: KATEC(${katecX}, ${katecY})`);
      console.warn(`  📄 응답 데이터:`, JSON.stringify(data, null, 2));
      console.warn(`  🔧 원인 분석:`);
      console.warn(`    1. 유효하지 않은 KATEC 좌표`);
      console.warn(`    2. 좌표계 형식 불일치`);
      console.warn(`    3. 카카오 API 서비스 제한`);
      return null;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`⏰ [KAKAO-API] 요청 타임아웃 (${timeout}ms)`);
      console.warn(`  📍 좌표: KATEC(${katecX}, ${katecY})`);
      console.warn(`  🔧 해결 방안:`);
      console.warn(`    1. 타임아웃 시간 증가 (현재: ${timeout}ms)`);
      console.warn(`    2. 네트워크 연결 상태 확인`);
      console.warn(`    3. 카카오 API 서버 상태 확인`);
    } else {
      console.error(`💥 [KAKAO-API] 좌표 변환 실패`);
      console.error(`  📍 좌표: KATEC(${katecX}, ${katecY})`);
      console.error(`  🔍 오류 상세:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      console.error(`  🔧 해결 방안:`);
      console.error(`    1. API 키 확인: ${KAKAO_REST_API_KEY.substring(0, 10)}...`);
      console.error(`    2. 네트워크 연결 확인`);
      console.error(`    3. 카카오 API 서비스 상태 확인`);
      console.error(`    4. 요청 형식 확인`);
    }
    return null;
  }
};

/**
 * proj4를 사용한 폴백 좌표 변환 함수
 * Kakao API 실패 시 사용
 */
const convertWithProj4Fallback = (katecX: number, katecY: number): { latitude: number; longitude: number } | null => {
  try {
    console.log(`[PROJ4-FALLBACK] Kakao API 실패로 proj4 폴백 시작: (${katecX}, ${katecY})`);

    // 여러 좌표계를 순차적으로 시도 (제주도 전용 좌표계 우선)
    const coordinateSystemsToTry = [
      { name: 'JEJU_126_5_Y0', proj: COORDINATE_SYSTEMS.JEJU_126_5_Y0 },
      { name: 'JEJU_126_5_Y500', proj: COORDINATE_SYSTEMS.JEJU_126_5_Y500 },
      { name: 'JEJU_126_5_Y550', proj: COORDINATE_SYSTEMS.JEJU_126_5_Y550 },
      { name: 'JEJU_126_Y0', proj: COORDINATE_SYSTEMS.JEJU_126_Y0 },
      { name: 'JEJU_126_Y500', proj: COORDINATE_SYSTEMS.JEJU_126_Y500 },
      { name: 'JEJU_126_Y550', proj: COORDINATE_SYSTEMS.JEJU_126_Y550 },
      { name: 'JEJU_126_5_BESSEL_Y0', proj: COORDINATE_SYSTEMS.JEJU_126_5_BESSEL_Y0 },
      { name: 'JEJU_126_5_BESSEL_Y500', proj: COORDINATE_SYSTEMS.JEJU_126_5_BESSEL_Y500 },
      { name: 'JEJU_CENTRAL', proj: COORDINATE_SYSTEMS.JEJU_CENTRAL },
      { name: 'JEJU_ORIGIN', proj: COORDINATE_SYSTEMS.JEJU_ORIGIN }
    ];

    for (const coordSystem of coordinateSystemsToTry) {
      try {
        const result = proj4(coordSystem.proj, WGS84_PROJ, [katecX, katecY]);

        if (!result || result.length !== 2) {
          continue;
        }

        const longitude = result[0];
        const latitude = result[1];

        // 제주도 영역 검증
        if (latitude >= 33.0 && latitude <= 33.8 && longitude >= 126.0 && longitude <= 128.2) {
          console.log(`[PROJ4-FALLBACK] ✅ 좌표변환 성공 (${coordSystem.name}): (${katecX}, ${katecY}) → WGS84(${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
          return {
            latitude: Math.round(latitude * 1000000) / 1000000,
            longitude: Math.round(longitude * 1000000) / 1000000
          };
        }
      } catch (err) {
        continue;
      }
    }

    console.warn(`[PROJ4-FALLBACK] 모든 좌표계 시도 실패: (${katecX}, ${katecY})`);
    return null;
  } catch (error) {
    console.error('[PROJ4-FALLBACK] 좌표 변환 실패:', error, `좌표: (${katecX}, ${katecY})`);
    return null;
  }
};

/**
 * 제주도 API의 gisxcoor, gisycoor 좌표를 WGS84 좌표계로 변환하는 함수
 * 1차: Kakao API 사용 (권장)
 * 2차: proj4 라이브러리 폴백 (Kakao API 실패 시)
 *
 * 제주도 API에서 제공하는 KATEC 좌표를 정확히 WGS84로 변환
 * @param katecX KATEC X 좌표
 * @param katecY KATEC Y 좌표
 * @param timeout Kakao API 타임아웃 시간 (밀리초, 기본값: 5000ms)
 */
export const convertKatecToWgs84 = async (katecX: number, katecY: number, timeout: number = 5000): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const conversionStartTime = Date.now();

    // 좌표가 유효하지 않은 경우
    if (!katecX || !katecY || katecX === 0 || katecY === 0) {
      console.warn(`⚠️ [COORD-CONVERT] 유효하지 않은 좌표 입력`);
      console.warn(`  📍 입력값: X=${katecX}, Y=${katecY}`);
      console.warn(`  🔧 원인: null, undefined, 또는 0 값`);
      return null;
    }

    // 캐시 키 생성
    const cacheKey = `${katecX},${katecY}`;

    // 캐시에서 확인
    if (coordinateCache.has(cacheKey)) {
      const cachedResult = coordinateCache.get(cacheKey);
      const cacheHitTime = Date.now() - conversionStartTime;
      console.log(`💾 [COORD-CONVERT] 캐시 히트! (${cacheHitTime}ms)`);
      console.log(`  📍 좌표: KATEC(${katecX}, ${katecY})`);
      console.log(`  🎯 캐시된 결과: ${cachedResult ? `WGS84(${cachedResult.latitude}, ${cachedResult.longitude})` : 'null (변환 실패 기록)'}`);
      return cachedResult || null;
    }

    console.log(`🔄 [COORD-CONVERT] 새로운 좌표 변환 시작`);
    console.log(`  📍 입력 좌표: KATEC(${katecX}, ${katecY})`);
    console.log(`  ⏰ 타임아웃 설정: ${timeout}ms`);
    console.log(`  🎯 변환 목표: WGS84 (GPS 좌표계)`);
    console.log(`  📊 캐시 상태: ${coordinateCache.size}개 좌표 캐시됨`);

    // 1차 시도: Kakao API 사용 (타임아웃 적용)
    console.log(`🥇 [COORD-CONVERT] 1차 시도: 카카오 API 사용`);
    try {
      const kakaoStartTime = Date.now();
      const kakaoResult = await convertWithKakaoAPI(katecX, katecY, timeout);
      const kakaoDuration = Date.now() - kakaoStartTime;

      if (kakaoResult) {
        const totalDuration = Date.now() - conversionStartTime;
        console.log(`✅ [COORD-CONVERT] 카카오 API 변환 성공! (${totalDuration}ms)`);
        console.log(`  📍 결과: WGS84(${kakaoResult.latitude}, ${kakaoResult.longitude})`);
        console.log(`  💾 캐시에 저장 완료`);

        // 캐시에 저장
        coordinateCache.set(cacheKey, kakaoResult);
        return kakaoResult;
      } else {
        console.warn(`❌ [COORD-CONVERT] 카카오 API 변환 실패 (${kakaoDuration}ms)`);
        console.warn(`  🔄 proj4 폴백으로 전환합니다...`);
      }
    } catch (error: any) {
      console.warn(`💥 [COORD-CONVERT] 카카오 API 호출 중 예외 발생`);
      console.warn(`  🔍 오류: ${error.message}`);
      console.warn(`  🔄 proj4 폴백으로 전환합니다...`);
    }

    // 2차 시도: proj4 폴백
    console.log(`🥈 [COORD-CONVERT] 2차 시도: proj4 라이브러리 폴백`);
    const proj4Result = convertWithProj4Fallback(katecX, katecY);

    // 결과를 캐시에 저장 (실패한 경우도 캐시하여 재시도 방지)
    coordinateCache.set(cacheKey, proj4Result);

    if (proj4Result) {
      const totalDuration = Date.now() - conversionStartTime;
      console.log(`✅ [COORD-CONVERT] proj4 폴백 변환 성공! (${totalDuration}ms)`);
      console.log(`  📍 결과: WGS84(${proj4Result.latitude}, ${proj4Result.longitude})`);
      console.log(`  💾 캐시에 저장 완료`);
      return proj4Result;
    }

    const totalDuration = Date.now() - conversionStartTime;
    console.error(`❌ [COORD-CONVERT] 모든 변환 방법 실패 (${totalDuration}ms)`);
    console.error(`  📍 입력 좌표: KATEC(${katecX}, ${katecY})`);
    console.error(`  🔧 시도한 방법:`);
    console.error(`    1. 카카오 API (KTM → WGS84)`);
    console.error(`    2. proj4 라이브러리 (다중 좌표계 시도)`);
    console.error(`  💡 권장 사항:`);
    console.error(`    1. 원본 좌표 데이터 확인`);
    console.error(`    2. 좌표계 형식 재검토`);
    console.error(`    3. 네트워크 연결 상태 확인`);
    return null;

  } catch (error: any) {
    const totalDuration = Date.now() - (Date.now() - 5000); // 대략적인 시간
    console.error(`💥 [COORD-CONVERT] 좌표 변환 중 예외 발생 (${totalDuration}ms)`);
    console.error(`  📍 좌표: KATEC(${katecX}, ${katecY})`);
    console.error(`  🔍 오류 상세:`, {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    return null;
  }
};

/**
 * 동기 버전의 좌표 변환 함수 (proj4만 사용)
 * 기존 코드와의 호환성을 위해 제공
 * @deprecated 가능하면 convertKatecToWgs84 (비동기 버전) 사용 권장
 */
export const convertKatecToWgs84Sync = (katecX: number, katecY: number): { latitude: number; longitude: number } | null => {
  try {
    // 좌표가 유효하지 않은 경우
    if (!katecX || !katecY || katecX === 0 || katecY === 0) {
      console.warn(`[COORD-CONVERT-SYNC] 유효하지 않은 좌표: (${katecX}, ${katecY})`);
      return null;
    }

    console.log(`[COORD-CONVERT-SYNC] proj4 동기 좌표변환 시작: (${katecX}, ${katecY})`);
    return convertWithProj4Fallback(katecX, katecY);

  } catch (error) {
    console.error('[COORD-CONVERT-SYNC] 좌표 변환 실패:', error, `좌표: (${katecX}, ${katecY})`);
    return null;
  }
};

// UTF-8 문자열을 Base64로 안전하게 인코딩하는 함수
export const encodeToBase64 = (str: string): string => {
  try {
    // 한글 등 유니코드 문자를 안전하게 처리
    // TextEncoder를 사용하여 UTF-8 바이트 배열로 변환 후 Base64 인코딩
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  } catch (error) {
    console.error('Base64 인코딩 실패:', error);
    // 폴백: 간단한 텍스트로 대체
    return btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="2"/></svg>');
  }
};

// 최저가 주유소 TOP10 목록 업데이트
export const updateTopLowestPriceStations = (stations: GasStation[], selectedFuel: string): GasStation[] => {
  if (!selectedFuel || !stations.length) {
    return [];
  }

  // 선택된 연료 타입의 가격이 있는 주유소만 필터링
  const stationsWithPrice = stations.filter(station => {
    if (!station.prices) return false;
    
    switch (selectedFuel) {
      case 'gasoline':
        return station.prices.gasoline > 0;
      case 'diesel':
        return station.prices.diesel > 0;
      case 'lpg':
        return station.prices.lpg > 0;
      default:
        return false;
    }
  });

  // 가격순으로 정렬
  const sortedStations = stationsWithPrice.sort((a, b) => {
    const priceA = getStationPrice(a, selectedFuel);
    const priceB = getStationPrice(b, selectedFuel);
    return priceA - priceB;
  });

  // TOP10 반환
  return sortedStations.slice(0, 10);
};

// 선택된 연료의 가격 정보 HTML 생성
export const generatePriceInfoHtml = (station: GasStation, selectedFuel: string): string => {
  let mainPriceInfo = '';
  let currentPrice = 0;

  if (station.prices) {
    switch (selectedFuel) {
      case 'gasoline':
        if (station.prices.gasoline > 0) {
          currentPrice = station.prices.gasoline;
          mainPriceInfo = `<div style="color:#e74c3c; font-weight:bold; font-size:14px;">휘발유 ${currentPrice.toLocaleString()}원/L</div>`;
        }
        break;
      case 'diesel':
        if (station.prices.diesel > 0) {
          currentPrice = station.prices.diesel;
          mainPriceInfo = `<div style="color:#27ae60; font-weight:bold; font-size:14px;">경유 ${currentPrice.toLocaleString()}원/L</div>`;
        }
        break;
      case 'lpg':
        if (station.prices.lpg > 0) {
          currentPrice = station.prices.lpg;
          mainPriceInfo = `<div style="color:#3498db; font-weight:bold; font-size:14px;">LPG ${currentPrice.toLocaleString()}원/L</div>`;
        }
        break;
      default:
        // 전체 선택시 가장 저렴한 가격 표시
        const prices = [
          { type: '휘발유', price: station.prices.gasoline, color: '#e74c3c' },
          { type: '경유', price: station.prices.diesel, color: '#27ae60' },
          { type: 'LPG', price: station.prices.lpg, color: '#3498db' }
        ].filter(p => p.price > 0);
        
        if (prices.length > 0) {
          const cheapest = prices.reduce((min, p) => p.price < min.price ? p : min);
          currentPrice = cheapest.price;
          mainPriceInfo = `<div style="color:${cheapest.color}; font-weight:bold; font-size:14px;">${cheapest.type} ${cheapest.price.toLocaleString()}원/L</div>`;
        }
    }
  }

  if (!mainPriceInfo) {
    mainPriceInfo = '<div style="color:#95a5a6; font-size:12px;">가격 정보 없음</div>';
  }

  return mainPriceInfo;
};

// 좋아요 관련 유틸리티 함수들
const FAVORITES_STORAGE_KEY = 'gas_station_favorites';

// 기존 좋아요 데이터 마이그레이션
const migrateFavoriteData = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return;

    const favorites = JSON.parse(stored);
    if (favorites.length === 0) return;

    // 첫 번째 항목에 fuelType이 없으면 마이그레이션 필요
    if (favorites[0] && !favorites[0].fuelType) {
      console.log('좋아요 데이터 마이그레이션 시작...');

      // 기존 데이터를 휘발유 기준으로 마이그레이션
      const migratedFavorites = favorites.map((fav: any) => ({
        ...fav,
        fuelType: 'gasoline' // 기본값으로 휘발유 설정
      }));

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(migratedFavorites));
      console.log('좋아요 데이터 마이그레이션 완료');
    }
  } catch (error) {
    console.error('좋아요 데이터 마이그레이션 실패:', error);
  }
};

// 좋아요 목록 가져오기
export const getFavoriteStations = (): FavoriteStation[] => {
  if (typeof window === 'undefined') return [];

  // 첫 호출 시 마이그레이션 실행
  migrateFavoriteData();

  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('좋아요 목록 로드 실패:', error);
    return [];
  }
};

// 좋아요 추가 (연료 타입별 관리 및 개수 제한)
export const addFavoriteStation = (station: GasStation, fuelType: string): { success: boolean; message?: string } => {
  if (typeof window === 'undefined') return { success: false, message: '브라우저 환경이 아닙니다.' };

  try {
    const favorites = getFavoriteStations();

    // 이미 좋아요한 주유소인지 확인 (같은 연료 타입으로)
    if (favorites.some(fav => fav.opinet_id === station.opinet_id && fav.fuelType === fuelType)) {
      return { success: false, message: '이미 좋아요한 주유소입니다.' };
    }

    // 해당 연료 타입의 좋아요 개수 확인 (최대 3개)
    const currentFuelTypeFavorites = favorites.filter(fav => fav.fuelType === fuelType);
    if (currentFuelTypeFavorites.length >= 3) {
      return { success: false, message: '주유소 3개까지만 좋아요 가능해요' };
    }

    const newFavorite: FavoriteStation = {
      opinet_id: station.opinet_id,
      name: station.name,
      address: station.address,
      brand: station.brand?.name,
      addedAt: new Date().toISOString(),
      fuelType: fuelType
    };

    favorites.push(newFavorite);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    return { success: true };
  } catch (error) {
    console.error('좋아요 추가 실패:', error);
    return { success: false, message: '좋아요 추가 중 오류가 발생했습니다.' };
  }
};

// 좋아요 제거 (특정 연료 타입으로)
export const removeFavoriteStation = (opinet_id: string, fuelType: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const favorites = getFavoriteStations();
    const filteredFavorites = favorites.filter(fav => !(fav.opinet_id === opinet_id && fav.fuelType === fuelType));

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filteredFavorites));
    return true;
  } catch (error) {
    console.error('좋아요 제거 실패:', error);
    return false;
  }
};

// 좋아요 여부 확인 (특정 연료 타입으로)
export const isFavoriteStation = (opinet_id: string, fuelType: string): boolean => {
  const favorites = getFavoriteStations();
  return favorites.some(fav => fav.opinet_id === opinet_id && fav.fuelType === fuelType);
};

// 좋아요 토글 (연료 타입별)
export const toggleFavoriteStation = (station: GasStation, fuelType: string): { success: boolean; isFavorite: boolean; message?: string } => {
  if (isFavoriteStation(station.opinet_id, fuelType)) {
    const removed = removeFavoriteStation(station.opinet_id, fuelType);
    return { success: removed, isFavorite: false };
  } else {
    const result = addFavoriteStation(station, fuelType);
    return { success: result.success, isFavorite: result.success, message: result.message };
  }
};

// 좋아요한 주유소 중 최저가 TOP3 가져오기 (특정 연료 타입만)
export const getFavoriteTop3Stations = (allStations: GasStation[], selectedFuel: string): GasStation[] => {
  if (!selectedFuel) return [];

  const favorites = getFavoriteStations();

  // 현재 선택된 연료 타입으로 좋아요한 주유소들만 필터링
  const currentFuelFavorites = favorites.filter(fav => fav.fuelType === selectedFuel);

  // 좋아요한 주유소들을 전체 주유소 목록에서 찾기
  const favoriteStations = allStations.filter(station =>
    currentFuelFavorites.some(fav => fav.opinet_id === station.opinet_id)
  );

  if (favoriteStations.length === 0) {
    return [];
  }

  // 선택된 연료 타입의 가격이 있는 주유소만 필터링
  const stationsWithPrice = favoriteStations.filter(station => {
    if (!station.prices) return false;

    switch (selectedFuel) {
      case 'gasoline':
        return station.prices.gasoline > 0;
      case 'diesel':
        return station.prices.diesel > 0;
      case 'lpg':
        return station.prices.lpg > 0;
      default:
        return false;
    }
  });

  // 가격순으로 정렬
  const sortedStations = stationsWithPrice.sort((a, b) => {
    const priceA = getStationPrice(a, selectedFuel);
    const priceB = getStationPrice(b, selectedFuel);
    return priceA - priceB;
  });

  // TOP3 반환
  return sortedStations.slice(0, 3);
};

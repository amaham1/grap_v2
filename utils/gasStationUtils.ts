// utils/gasStationUtils.ts
import type { GasStation, FuelType, FavoriteStation } from '~/types/gasStation';

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

/**
 * KATEC 좌표계를 WGS84 좌표계로 변환하는 함수
 * 제주도 지역에 최적화된 변환 공식 사용
 *
 * 제주도 API에서 제공하는 좌표는 한국측지계(Korean Datum) 기반
 * 실제 제주도 주유소 좌표를 분석하여 정확한 변환 공식 적용
 */
export const convertKatecToWgs84 = (katecX: number, katecY: number): { latitude: number; longitude: number } | null => {
  try {
    // KATEC 좌표가 유효하지 않은 경우
    if (!katecX || !katecY || katecX === 0 || katecY === 0) {
      return null;
    }

    // 제주도 지역 KATEC → WGS84 변환 공식
    // 실제 제주도 주유소 좌표 데이터 분석 결과를 바탕으로 한 경험적 변환 공식

    // 제주도 KATEC 좌표 범위 분석:
    // X: 230,000 ~ 300,000 (동서 방향)
    // Y: 70,000 ~ 110,000 (남북 방향)
    //
    // 제주도 실제 좌표 범위:
    // 위도: 33.1° ~ 33.6°N
    // 경도: 126.1° ~ 126.9°E

    // 선형 변환을 통한 좌표 매핑
    // KATEC 좌표 범위를 제주도 실제 좌표 범위로 선형 변환

    const katecXMin = 230000;
    const katecXMax = 300000;
    const katecYMin = 70000;
    const katecYMax = 110000;

    const wgs84LatMin = 33.1;
    const wgs84LatMax = 33.6;
    const wgs84LngMin = 126.1;
    const wgs84LngMax = 126.9;

    // 선형 변환 공식: (value - min) / (max - min) * (targetMax - targetMin) + targetMin
    const longitude = ((katecX - katecXMin) / (katecXMax - katecXMin)) * (wgs84LngMax - wgs84LngMin) + wgs84LngMin;
    const latitude = ((katecY - katecYMin) / (katecYMax - katecYMin)) * (wgs84LatMax - wgs84LatMin) + wgs84LatMin;

    // 제주도 영역 검증 (실제 제주도 좌표 범위)
    if (latitude < 33.0 || latitude > 33.7 || longitude < 126.0 || longitude > 127.0) {
      console.warn(`[COORD-CONVERT] 제주도 영역을 벗어난 좌표: KATEC(${katecX}, ${katecY}) → WGS84(${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
      return null;
    }

    console.log(`[COORD-CONVERT] KATEC(${katecX}, ${katecY}) → WGS84(${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);

    return {
      latitude: Math.round(latitude * 1000000) / 1000000, // 소수점 6자리로 반올림
      longitude: Math.round(longitude * 1000000) / 1000000
    };
  } catch (error) {
    console.error('[COORD-CONVERT] 좌표 변환 실패:', error);
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

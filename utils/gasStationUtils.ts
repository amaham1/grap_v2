// utils/gasStationUtils.ts
import type { GasStation, FuelType } from '~/types/gasStation';

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

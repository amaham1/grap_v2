// utils/debugUtils.ts
import type { GasStation } from '~/types/gasStation';

// 디버그 정보 저장소
const debugInfo = ref<Record<string, any>>({});

// 디버그 정보 업데이트
export const updateDebugInfo = (key: string, value: any) => {
  debugInfo.value[key] = {
    data: value,
    timestamp: new Date().toISOString()
  };
};

// 디버그 정보 가져오기
export const getDebugInfo = (key?: string) => {
  if (key) {
    return debugInfo.value[key];
  }
  return debugInfo.value;
};

// 환경 정보 로깅 (개발 모드에서만)
export const logEnvironmentInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 [DEBUG] 환경 정보:', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      location: {
        href: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host
      },
      timestamp: new Date().toISOString()
    });
  }
};

// 디버그 함수들을 전역에 설정
export const setupDebugFunctions = (allStations: Ref<GasStation[]>) => {
  if (typeof window === 'undefined') return;

  try {
    // 전역 디버그 객체 생성
    (window as any).debugGasStations = {
      // 현재 상태 정보
      getState: () => ({
        allStations: allStations.value,
        debugInfo: debugInfo.value,
        timestamp: new Date().toISOString()
      }),
      
      // 주유소 목록 출력
      listStations: () => {
        console.table(allStations.value.map(station => ({
          name: station.name,
          brand: station.brand,
          address: station.address,
          gasoline: station.prices?.gasoline || 0,
          diesel: station.prices?.diesel || 0,
          lpg: station.prices?.lpg || 0,
          distance: station.distance || 0
        })));
      },
      
      // 디버그 정보 출력
      showDebugInfo: () => {
        console.log('🔍 [DEBUG-INFO]', debugInfo.value);
      },
      
      // 환경 정보 출력
      showEnvironment: () => {
        logEnvironmentInfo();
      },
      
      // 특정 주유소 정보 출력
      findStation: (name: string) => {
        const found = allStations.value.filter(station => 
          station.name.toLowerCase().includes(name.toLowerCase())
        );
        console.log(`🔍 [SEARCH] "${name}" 검색 결과:`, found);
        return found;
      },
      
      // 가격 통계 출력
      priceStats: (fuelType: 'gasoline' | 'diesel' | 'lpg' = 'gasoline') => {
        const prices = allStations.value
          .map(station => station.prices?.[fuelType])
          .filter(price => price && price > 0) as number[];
          
        if (prices.length === 0) {
          console.log(`📊 [STATS] ${fuelType} 가격 정보 없음`);
          return;
        }
        
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        console.log(`📊 [STATS] ${fuelType} 가격 통계:`, {
          count: prices.length,
          min: min.toLocaleString(),
          max: max.toLocaleString(),
          avg: Math.round(avg).toLocaleString(),
          range: (max - min).toLocaleString()
        });
      }
    };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [DEBUG-SETUP-ERROR] 디버그 함수 설정 실패:', error);
    }
  }
};

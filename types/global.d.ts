// types/global.d.ts
// 전역 타입 정의

// 카카오 맵 API 타입
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: any;
        LatLng: any;
        Marker: any;
        InfoWindow: any;
        MarkerImage: any;
        Size: any;
        Point: any;
        CustomOverlay: any;
        MapTypeControl: any;
        ZoomControl: any;
        ControlPosition: any;
        event: {
          addListener: (target: any, type: string, handler: Function) => void;
          removeListener: (target: any, type: string, handler: Function) => void;
        };
        services: {
          Geocoder: any;
          Places: any;
        };
        drawing: {
          OverlayType: any;
          DrawingManager: any;
        };
      };
    };
    
    // 커스텀 전역 함수들
    closeInfoWindow?: () => void;
    toggleStationFavorite?: (opinet_id: string) => void;
    
    // 디버그 함수들
    debugGasStations?: {
      logEnv: () => void;
      logCurrentState: () => void;
      forceSearch: () => void;
      compareEnvironment: () => void;
      toggleDebug: () => void;
      getDebugInfo: () => any;
      testAPI: (lat?: number, lng?: number, radius?: number) => Promise<any>;
      getState: () => any;
      listStations: () => void;
      showDebugInfo: () => void;
      showEnvironment: () => void;
      findStation: (name: string) => any[];
      priceStats: (fuelType?: 'gasoline' | 'diesel' | 'lpg') => void;
    };
  }

  // 성능 API 확장
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // 네비게이터 확장
  interface Navigator {
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
      saveData: boolean;
    };
  }
}

// Vue 컴포넌트 타입 확장
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    // 전역 속성들을 여기에 정의할 수 있습니다
  }
}

// Nuxt 타입 확장
declare module '#app' {
  interface NuxtApp {
    // Nuxt 앱 인스턴스 확장
  }
}

// 환경 변수 타입
declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | 'test';
        NUXT_PUBLIC_SITE_URL?: string;
        NUXT_PUBLIC_API_BASE?: string;
        DATABASE_URL?: string;
        KAKAO_MAP_API_KEY?: string;
        GOOGLE_ADSENSE_CLIENT_ID?: string;
        GOOGLE_ADSENSE_SLOT_ID?: string;
      }
    }
  }
}

// 유틸리티 타입들
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ValueOf<T> = T[keyof T];

export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// 함수 타입들
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

export type EventHandler<T = Event> = (event: T) => void;

export type Callback<T = void> = () => T;

export type AsyncCallback<T = void> = () => Promise<T>;

// API 관련 타입들
export type HttpStatusCode = 
  | 200 | 201 | 204 | 400 | 401 | 403 | 404 | 422 | 429 | 500 | 502 | 503;

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 날짜 관련 타입들
export type DateString = string; // ISO 8601 format
export type TimeString = string; // HH:mm:ss format
export type DateTimeString = string; // ISO 8601 datetime format

// 좌표 관련 타입들
export type Latitude = number;
export type Longitude = number;
export type Coordinates = [Longitude, Latitude];

// 색상 관련 타입들
export type HexColor = `#${string}`;
export type RgbColor = `rgb(${number}, ${number}, ${number})`;
export type RgbaColor = `rgba(${number}, ${number}, ${number}, ${number})`;
export type Color = HexColor | RgbColor | RgbaColor | string;

// 크기 관련 타입들
export type Size = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type Rect = Position & Size;

// 정렬 관련 타입들
export type SortOrder = 'asc' | 'desc';
export type SortDirection = 'ascending' | 'descending';

// 상태 관련 타입들
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// 폼 관련 타입들
export type FormField<T = any> = {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
};

export type FormState<T extends Record<string, any>> = {
  [K in keyof T]: FormField<T[K]>;
};

// 검색 관련 타입들
export type SearchFilter<T = any> = {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
  value: any;
};

export type SearchSort<T = any> = {
  field: keyof T;
  order: SortOrder;
};

// 페이지네이션 타입들
export type PaginationParams = {
  page: number;
  pageSize: number;
  total?: number;
};

export type PaginatedData<T> = {
  items: T[];
  pagination: PaginationParams & {
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// 이벤트 타입들
export type CustomEvent<T = any> = {
  type: string;
  data: T;
  timestamp: Date;
};

// 로그 레벨 타입
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// 브라우저 지원 확인 타입
export type BrowserSupport = {
  geolocation: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;
  pushNotifications: boolean;
};

export {};

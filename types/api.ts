// types/api.ts
// API 응답 관련 타입 정의

// 기본 API 응답 구조
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 페이지네이션이 포함된 API 응답
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
  items: T[];
}

// API 에러 응답
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp: string;
}

// 검색 필터 기본 구조
export interface BaseSearchFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// HTTP 메서드 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API 엔드포인트 설정
export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  requiresAuth?: boolean;
  timeout?: number;
}

// 요청 옵션
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

// 파일 업로드 관련
export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

// 배치 작업 응답
export interface BatchOperationResponse {
  success: boolean;
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    index: number;
    error: string;
    item?: any;
  }>;
}

// 상태 체크 응답
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: Record<string, {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    error?: string;
  }>;
  version?: string;
  uptime?: number;
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  expiresIn?: number;
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  expiresIn?: number;
  error?: string;
}

// 통계 관련 타입
export interface StatsResponse {
  success: boolean;
  data: Record<string, number | string>;
  period?: {
    start: string;
    end: string;
  };
  metadata?: Record<string, any>;
}

// 로그 관련 타입
export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  source?: string;
  userId?: number;
}

export interface LogSearchFilters extends BaseSearchFilters {
  level?: LogEntry['level'];
  startDate?: string;
  endDate?: string;
  source?: string;
  userId?: number;
}

// 설정 관련 타입
export interface ConfigItem {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category?: string;
  isPublic?: boolean;
  updatedAt?: string;
}

export interface ConfigUpdateRequest {
  key: string;
  value: any;
}

// 알림 관련 타입
export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
}

// 메타데이터 타입
export interface ApiMetadata {
  requestId?: string;
  processingTime?: number;
  cacheHit?: boolean;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: string;
  };
}

// 확장된 API 응답 (메타데이터 포함)
export interface ExtendedApiResponse<T = any> extends ApiResponse<T> {
  metadata?: ApiMetadata;
}

// 타입 가드 함수들
export const isApiResponse = (obj: any): obj is ApiResponse => {
  return obj && typeof obj === 'object' && typeof obj.success === 'boolean';
};

export const isPaginatedResponse = (obj: any): obj is PaginatedApiResponse => {
  return isApiResponse(obj) && obj.pagination && Array.isArray(obj.items);
};

export const isErrorResponse = (obj: any): obj is ApiErrorResponse => {
  return isApiResponse(obj) && obj.success === false && obj.error;
};

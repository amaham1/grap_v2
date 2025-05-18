// 이 파일이 이미 존재하고 다른 타입들이 있다면 Festival 인터페이스만 추가합니다.
// 파일이 없다면 새로 생성됩니다.

export interface Festival {
  id: string; // 원본 API ID 또는 내부 UUID
  title: string;
  region?: string; // 지역
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  description?: string;
  main_image_url?: string;
  latitude?: number;
  longitude?: number;
  is_show: boolean; // 0 또는 1 (tinyint(1))
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  original_api_id?: string; // 외부 API 원본 ID (중복 방지용)
  tel?: string;
  homepage?: string;
  use_fee?: string;
  // 기타 필요한 필드 추가
}

export interface Exhibition {
  id: string;
  title: string;
  place?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  main_image_url?: string;
  is_show: boolean;
  created_at: string;
  updated_at: string;
  original_api_id?: string;
  tel?: string;
  homepage?: string;
  use_fee?: string;
  // 기타 필요한 필드 추가
}

export interface WelfareService {
  id: string; // original_api_id와 동일하게 사용될 수 있음
  service_name: string; // servNm
  service_target?: string; // jurMnofNm (소관부처명으로 대체 사용 또는 다른 필드 매핑)
  service_content?: string; // servDgst (서비스 요약)
  detailed_url?: string; // servDtlLink
  department_name?: string; // jurOrgNm (소관조직명)
  is_show: boolean;
  created_at: string;
  updated_at: string;
  fetched_at: string; // 데이터 수집 시각
  original_api_id: string; // API의 ID (예: servId)
  // 기타 필요한 필드 추가
}

// LogDAO 등에서 사용할 로그 타입
export interface ApiFetchLog {
  id?: number;
  source_name: string; // 'festivals', 'exhibitions', 'welfare-services'
  status: 'success' | 'failure';
  message?: string;
  items_added?: number;
  items_updated?: number;
  items_processed?: number;
  triggered_by?: string; // 'cron' or 'manual:admin_user_id'
  created_at?: string;
}

export interface SystemErrorLog {
  id?: number;
  error_message: string;
  stack_trace?: string;
  source?: string; // 오류 발생 위치 (e.g., 'api-festivals', 'cron-welfare')
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  created_at?: string;
  updated_at?: string;
}

// 이 파일이 이미 존재하고 다른 타입들이 있다면 Festival 인터페이스만 추가합니다.
// 파일이 없다면 새로 생성됩니다.

export interface Festival {
  id?: number; // 데이터베이스 자동 증가 ID
  original_api_id?: string; // API 원본 ID (UNIQUE)
  title: string; // 제목 (NOT NULL)
  content_html?: string; // 내용 HTML
  content?: string; // 사용자 입력 텍스트 내용
  source_url?: string; // 원본 URL
  writer_name?: string; // 작성자명
  written_date?: string; // 작성일 (ISO datetime string)
  files_info?: any; // 파일 정보 (JSONB)
  api_raw_data?: any; // 원본 API 응답 데이터 (JSONB, 수동 등록시 빈 객체)
  is_exposed?: boolean; // 노출 여부 (기본값: false)
  admin_memo?: string; // 관리자 메모
  fetched_at?: string; // 데이터 수집 시간 (ISO datetime string)
  created_at?: string; // 생성 시간 (ISO datetime string)
  updated_at?: string; // 수정 시간 (ISO datetime string)

  // 기존 호환성을 위한 필드들 (deprecated)
  region?: string; // 지역
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  description?: string;
  main_image_url?: string;
  latitude?: number;
  longitude?: number;
  is_show?: boolean; // is_exposed와 동일
  tel?: string;
  homepage?: string;
  use_fee?: string;
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

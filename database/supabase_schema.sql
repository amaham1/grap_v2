-- Supabase PostgreSQL DDL
-- 모든 테이블 스키마 정의

-- 1. 주유소 기본 정보 테이블
CREATE TABLE gas_stations (
    id SERIAL PRIMARY KEY,
    opinet_id VARCHAR(20) NOT NULL UNIQUE, -- 오피넷 ID (API의 id 필드)
    station_name VARCHAR(100) NOT NULL, -- 주유소 상호명
    brand_code VARCHAR(10), -- 주유소 상표 코드 (SKE, GSC, SOL, HDO, RTO, RTX, NHO, ETC/NCO)
    brand_name VARCHAR(50), -- 주유소 상표명
    gas_brand_code VARCHAR(10), -- 충전소 상표 코드 (SKE, GSC, SOL, HDO, ETC, SKG, E1G)
    gas_brand_name VARCHAR(50), -- 충전소 상표명
    zip_code VARCHAR(10), -- 우편번호
    address TEXT, -- 주소
    phone VARCHAR(20), -- 전화번호
    station_type VARCHAR(1) DEFAULT 'N' CHECK (station_type IN ('N', 'Y', 'C')), -- 주유소/충전소 구분 (N:주유소, Y:충전소, C:겸업)
    katec_x DECIMAL(15, 6), -- X 좌표 (카텍좌표)
    katec_y DECIMAL(15, 6), -- Y 좌표 (카텍좌표)
    latitude DECIMAL(10, 8), -- 위도 (WGS84)
    longitude DECIMAL(11, 8), -- 경도 (WGS84)
    api_raw_data TEXT, -- 원본 API 응답 데이터 (JSON 문자열)
    is_exposed BOOLEAN DEFAULT FALSE, -- 노출 여부
    admin_memo TEXT, -- 관리자 메모
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 데이터 수집 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 생성 시간
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 수정 시간
);

-- 인덱스 생성
CREATE INDEX idx_gas_stations_opinet_id ON gas_stations(opinet_id);
CREATE INDEX idx_gas_stations_station_name ON gas_stations(station_name);
CREATE INDEX idx_gas_stations_brand_code ON gas_stations(brand_code);
CREATE INDEX idx_gas_stations_station_type ON gas_stations(station_type);
CREATE INDEX idx_gas_stations_is_exposed ON gas_stations(is_exposed);
CREATE INDEX idx_gas_stations_location ON gas_stations(latitude, longitude);
CREATE INDEX idx_gas_stations_fetched_at ON gas_stations(fetched_at);

-- 2. 주유소 가격 정보 테이블
CREATE TABLE gas_prices (
    id SERIAL PRIMARY KEY,
    opinet_id VARCHAR(20) NOT NULL, -- 오피넷 ID (gas_stations 테이블과 연결)
    gasoline_price INTEGER DEFAULT 0, -- 휘발유 가격 (원)
    premium_gasoline_price INTEGER DEFAULT 0, -- 고급 휘발유 가격 (원)
    diesel_price INTEGER DEFAULT 0, -- 경유 가격 (원)
    lpg_price INTEGER DEFAULT 0, -- LPG 가격 (원)
    price_date DATE, -- 가격 기준일
    api_raw_data TEXT, -- 원본 API 응답 데이터 (JSON 문자열)
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 데이터 수집 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 생성 시간
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 수정 시간
    
    CONSTRAINT unique_opinet_date UNIQUE (opinet_id, price_date),
    CONSTRAINT fk_gas_prices_opinet_id FOREIGN KEY (opinet_id) REFERENCES gas_stations(opinet_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_gas_prices_opinet_id ON gas_prices(opinet_id);
CREATE INDEX idx_gas_prices_price_date ON gas_prices(price_date);
CREATE INDEX idx_gas_prices_gasoline_price ON gas_prices(gasoline_price);
CREATE INDEX idx_gas_prices_diesel_price ON gas_prices(diesel_price);
CREATE INDEX idx_gas_prices_lpg_price ON gas_prices(lpg_price);
CREATE INDEX idx_gas_prices_fetched_at ON gas_prices(fetched_at);

-- 3. 주유소 브랜드 매핑 테이블
CREATE TABLE gas_station_brands (
    brand_code VARCHAR(10) PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL,
    brand_type VARCHAR(10) NOT NULL CHECK (brand_type IN ('gas', 'lpg')), -- 브랜드 타입
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 전시/공연 정보 테이블
CREATE TABLE exhibitions (
    id SERIAL PRIMARY KEY,
    original_api_id VARCHAR(50) UNIQUE, -- API 원본 ID
    title VARCHAR(200), -- 제목
    category_name VARCHAR(100), -- 카테고리명
    cover_image_url TEXT, -- 커버 이미지 URL
    start_date DATE, -- 시작일
    end_date DATE, -- 종료일
    time_info TEXT, -- 시간 정보
    pay_info TEXT, -- 요금 정보
    location_name VARCHAR(200), -- 장소명
    organizer_info TEXT, -- 주최자 정보
    tel_number VARCHAR(50), -- 전화번호
    status_info VARCHAR(100), -- 상태 정보
    division_name VARCHAR(100), -- 구분명
    api_raw_data TEXT NOT NULL, -- 원본 API 응답 데이터
    is_exposed BOOLEAN DEFAULT FALSE, -- 노출 여부
    admin_memo TEXT, -- 관리자 메모
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 데이터 수집 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 생성 시간
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 수정 시간
);

-- 인덱스 생성
CREATE INDEX idx_exhibitions_original_api_id ON exhibitions(original_api_id);
CREATE INDEX idx_exhibitions_title ON exhibitions(title);
CREATE INDEX idx_exhibitions_category_name ON exhibitions(category_name);
CREATE INDEX idx_exhibitions_is_exposed ON exhibitions(is_exposed);
CREATE INDEX idx_exhibitions_start_date ON exhibitions(start_date);
CREATE INDEX idx_exhibitions_end_date ON exhibitions(end_date);
CREATE INDEX idx_exhibitions_fetched_at ON exhibitions(fetched_at);

-- 5. 축제 정보 테이블
CREATE TABLE festivals (
    id SERIAL PRIMARY KEY,
    original_api_id VARCHAR(50) UNIQUE, -- API 원본 ID
    title VARCHAR(200) NOT NULL, -- 제목
    content_html TEXT, -- 내용 HTML
    source_url TEXT, -- 원본 URL
    writer_name VARCHAR(100), -- 작성자명
    written_date TIMESTAMP WITH TIME ZONE, -- 작성일
    files_info JSONB, -- 파일 정보 (JSON)
    api_raw_data JSONB NOT NULL, -- 원본 API 응답 데이터 (JSON)
    is_exposed BOOLEAN DEFAULT FALSE, -- 노출 여부
    admin_memo TEXT, -- 관리자 메모
    fetched_at TIMESTAMP WITH TIME ZONE, -- 데이터 수집 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 생성 시간
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 수정 시간
);

-- 인덱스 생성
CREATE INDEX idx_festivals_original_api_id ON festivals(original_api_id);
CREATE INDEX idx_festivals_title ON festivals(title);
CREATE INDEX idx_festivals_is_exposed ON festivals(is_exposed);
CREATE INDEX idx_festivals_written_date ON festivals(written_date);
CREATE INDEX idx_festivals_fetched_at ON festivals(fetched_at);

-- 6. 복지 서비스 정보 테이블
CREATE TABLE welfare_services (
    id SERIAL PRIMARY KEY,
    original_api_id VARCHAR(50) UNIQUE, -- API 원본 ID
    service_name VARCHAR(200) NOT NULL, -- 서비스명
    is_all_location BOOLEAN DEFAULT FALSE, -- 전체 지역 대상 여부
    is_jeju_location BOOLEAN DEFAULT FALSE, -- 제주시 대상 여부
    is_seogwipo_location BOOLEAN DEFAULT FALSE, -- 서귀포시 대상 여부
    support_target_html TEXT, -- 지원 대상 HTML
    support_content_html TEXT, -- 지원 내용 HTML
    application_info_html TEXT, -- 신청 정보 HTML
    api_raw_data JSONB NOT NULL, -- 원본 API 응답 데이터 (JSON)
    is_exposed BOOLEAN DEFAULT FALSE, -- 노출 여부
    admin_memo TEXT, -- 관리자 메모
    fetched_at TIMESTAMP WITH TIME ZONE, -- 데이터 수집 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 생성 시간
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 수정 시간
);

-- 인덱스 생성
CREATE INDEX idx_welfare_services_original_api_id ON welfare_services(original_api_id);
CREATE INDEX idx_welfare_services_service_name ON welfare_services(service_name);
CREATE INDEX idx_welfare_services_is_exposed ON welfare_services(is_exposed);
CREATE INDEX idx_welfare_services_is_all_location ON welfare_services(is_all_location);
CREATE INDEX idx_welfare_services_is_jeju_location ON welfare_services(is_jeju_location);
CREATE INDEX idx_welfare_services_is_seogwipo_location ON welfare_services(is_seogwipo_location);
CREATE INDEX idx_welfare_services_fetched_at ON welfare_services(fetched_at);

-- 7. 로그 테이블 (API 호출 로그 등)
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(200), -- API 엔드포인트
    method VARCHAR(10), -- HTTP 메소드
    status_code INTEGER, -- 응답 상태 코드
    request_data JSONB, -- 요청 데이터
    response_data JSONB, -- 응답 데이터
    error_message TEXT, -- 에러 메시지
    execution_time INTEGER, -- 실행 시간 (ms)
    user_agent TEXT, -- 사용자 에이전트
    ip_address INET, -- IP 주소
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX idx_api_logs_ip_address ON api_logs(ip_address);

-- 브랜드 기본 데이터 삽입
INSERT INTO gas_station_brands (brand_code, brand_name, brand_type) VALUES
('SKE', 'SK에너지', 'gas'),
('GSC', 'GS칼텍스', 'gas'),
('SOL', 'S-OIL', 'gas'),
('HDO', '현대오일뱅크', 'gas'),
('RTO', '자영알뜰', 'gas'),
('RTX', '고속도로(EX)알뜰', 'gas'),
('NHO', '농협(NH)알뜰', 'gas'),
('ETC', '자가상표', 'gas'),
('NCO', '자가상표', 'gas'),
('SKG', 'SK가스', 'lpg'),
('E1G', 'E1', 'lpg');

-- 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_gas_stations_updated_at BEFORE UPDATE ON gas_stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gas_prices_updated_at BEFORE UPDATE ON gas_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exhibitions_updated_at BEFORE UPDATE ON exhibitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_festivals_updated_at BEFORE UPDATE ON festivals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_welfare_services_updated_at BEFORE UPDATE ON welfare_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE, -- 이메일 (로그인 ID)
    password VARCHAR(255) NOT NULL, -- 해시된 비밀번호
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 사용자 역할 (admin, user 등)
    name VARCHAR(100), -- 사용자 이름
    is_active BOOLEAN DEFAULT TRUE, -- 활성 상태
    last_login_at TIMESTAMP WITH TIME ZONE, -- 마지막 로그인 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 생성 시간
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 수정 시간
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- users 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 관리자 계정 생성 (비밀번호: admin123!)
-- 실제 운영환경에서는 더 강력한 비밀번호로 변경해야 합니다.
INSERT INTO users (email, password, role, name, is_active) VALUES
('admin@grap.co.kr', '$2b$12$EqAJ0mDG6E2nVth5roaHEOmCQtPvDD2nIDmbO9aKsTTJP1VrhXoLO', 'admin', '시스템 관리자', TRUE);
-- 위 해시는 'admin123!' 비밀번호의 bcrypt 해시입니다.

-- RLS (Row Level Security) 활성화 (필요시)
-- ALTER TABLE gas_stations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gas_prices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE welfare_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

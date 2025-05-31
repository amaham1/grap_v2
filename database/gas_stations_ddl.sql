-- MySQL DDL (기존)
-- 주유소 기본 정보 테이블
CREATE TABLE gas_stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opinet_id VARCHAR(20) NOT NULL UNIQUE COMMENT '오피넷 ID (API의 id 필드)',
    station_name VARCHAR(100) NOT NULL COMMENT '주유소 상호명',
    brand_code VARCHAR(10) COMMENT '주유소 상표 코드 (SKE, GSC, SOL, HDO, RTO, RTX, NHO, ETC/NCO)',
    brand_name VARCHAR(50) COMMENT '주유소 상표명',
    gas_brand_code VARCHAR(10) COMMENT '충전소 상표 코드 (SKE, GSC, SOL, HDO, ETC, SKG, E1G)',
    gas_brand_name VARCHAR(50) COMMENT '충전소 상표명',
    zip_code VARCHAR(10) COMMENT '우편번호',
    address TEXT COMMENT '주소',
    phone VARCHAR(20) COMMENT '전화번호',
    station_type ENUM('N', 'Y', 'C') DEFAULT 'N' COMMENT '주유소/충전소 구분 (N:주유소, Y:충전소, C:겸업)',
    katec_x DECIMAL(15, 6) COMMENT 'X 좌표 (카텍좌표)',
    katec_y DECIMAL(15, 6) COMMENT 'Y 좌표 (카텍좌표)',
    latitude DECIMAL(10, 8) COMMENT '위도 (WGS84)',
    longitude DECIMAL(11, 8) COMMENT '경도 (WGS84)',
    api_raw_data TEXT COMMENT '원본 API 응답 데이터 (JSON 문자열)',
    is_exposed BOOLEAN DEFAULT FALSE COMMENT '노출 여부',
    admin_memo TEXT COMMENT '관리자 메모',
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '데이터 수집 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',

    INDEX idx_opinet_id (opinet_id),
    INDEX idx_station_name (station_name),
    INDEX idx_brand_code (brand_code),
    INDEX idx_station_type (station_type),
    INDEX idx_is_exposed (is_exposed),
    INDEX idx_location (latitude, longitude),
    INDEX idx_fetched_at (fetched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주유소 기본 정보';

-- 주유소 가격 정보 테이블
CREATE TABLE gas_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opinet_id VARCHAR(20) NOT NULL COMMENT '오피넷 ID (gas_stations 테이블과 연결)',
    gasoline_price INT DEFAULT 0 COMMENT '휘발유 가격 (원)',
    premium_gasoline_price INT DEFAULT 0 COMMENT '고급 휘발유 가격 (원)',
    diesel_price INT DEFAULT 0 COMMENT '경유 가격 (원)',
    lpg_price INT DEFAULT 0 COMMENT 'LPG 가격 (원)',
    price_date DATE COMMENT '가격 기준일',
    api_raw_data TEXT COMMENT '원본 API 응답 데이터 (JSON 문자열)',
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '데이터 수집 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',

    INDEX idx_opinet_id (opinet_id),
    INDEX idx_price_date (price_date),
    INDEX idx_gasoline_price (gasoline_price),
    INDEX idx_diesel_price (diesel_price),
    INDEX idx_lpg_price (lpg_price),
    INDEX idx_fetched_at (fetched_at),
    UNIQUE KEY unique_opinet_date (opinet_id, price_date),

    FOREIGN KEY (opinet_id) REFERENCES gas_stations(opinet_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주유소 가격 정보';

-- 주유소 브랜드 매핑 테이블 (참고용)
CREATE TABLE gas_station_brands (
    brand_code VARCHAR(10) PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL,
    brand_type ENUM('gas', 'lpg') NOT NULL COMMENT '브랜드 타입',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주유소 브랜드 매핑';

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

-- 사용자 테이블
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일 (로그인 ID)',
    password VARCHAR(255) NOT NULL COMMENT '해시된 비밀번호',
    role VARCHAR(50) NOT NULL DEFAULT 'user' COMMENT '사용자 역할 (admin, user 등)',
    name VARCHAR(100) COMMENT '사용자 이름',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    last_login_at TIMESTAMP NULL COMMENT '마지막 로그인 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 정보';

-- 기본 관리자 계정 생성 (비밀번호: admin123!)
-- 실제 운영환경에서는 더 강력한 비밀번호로 변경해야 합니다.
INSERT INTO users (email, password, role, name, is_active) VALUES
('admin@grap.co.kr', '$2b$12$EqAJ0mDG6E2nVth5roaHEOmCQtPvDD2nIDmbO9aKsTTJP1VrhXoLO', 'admin', '시스템 관리자', TRUE);
-- 위 해시는 'admin123!' 비밀번호의 bcrypt 해시입니다.

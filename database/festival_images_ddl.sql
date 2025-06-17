-- 축제 이미지 저장을 위한 테이블 DDL
-- MySQL/PostgreSQL 호환 스키마

-- 1. 축제 이미지 테이블
CREATE TABLE festival_images (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL, -- festivals 테이블의 id 참조
    original_filename VARCHAR(255) NOT NULL, -- 원본 파일명
    stored_filename VARCHAR(255) NOT NULL, -- 저장된 파일명 (UUID 기반)
    file_path TEXT NOT NULL, -- Cloudflare R2 저장 경로
    file_url TEXT NOT NULL, -- 접근 가능한 이미지 URL
    file_size INTEGER NOT NULL, -- 파일 크기 (bytes)
    mime_type VARCHAR(100) NOT NULL, -- MIME 타입 (image/jpeg, image/png 등)
    width INTEGER, -- 이미지 가로 크기 (픽셀)
    height INTEGER, -- 이미지 세로 크기 (픽셀)
    is_thumbnail BOOLEAN DEFAULT FALSE, -- 썸네일 여부 (축제당 하나만 true)
    display_order INTEGER DEFAULT 0, -- 표시 순서 (0부터 시작)
    alt_text VARCHAR(500), -- 이미지 대체 텍스트 (접근성)
    description TEXT, -- 이미지 설명
    upload_status VARCHAR(20) DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'failed', 'deleted')), -- 업로드 상태
    uploaded_by VARCHAR(100), -- 업로드한 관리자 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 생성 시간
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 수정 시간
);

-- 인덱스 생성
CREATE INDEX idx_festival_images_festival_id ON festival_images(festival_id);
CREATE INDEX idx_festival_images_is_thumbnail ON festival_images(is_thumbnail);
CREATE INDEX idx_festival_images_display_order ON festival_images(festival_id, display_order);
CREATE INDEX idx_festival_images_upload_status ON festival_images(upload_status);
CREATE INDEX idx_festival_images_created_at ON festival_images(created_at);

-- 외래키 제약조건 (festivals 테이블과 연결)
ALTER TABLE festival_images 
ADD CONSTRAINT fk_festival_images_festival_id 
FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE;

-- 축제당 썸네일은 하나만 허용하는 유니크 제약조건
CREATE UNIQUE INDEX idx_festival_images_unique_thumbnail 
ON festival_images(festival_id) 
WHERE is_thumbnail = TRUE;

-- 트리거: 썸네일 설정 시 기존 썸네일 해제
-- PostgreSQL용 트리거 함수
CREATE OR REPLACE FUNCTION ensure_single_thumbnail()
RETURNS TRIGGER AS $$
BEGIN
    -- 새로 삽입/업데이트되는 레코드가 썸네일로 설정되는 경우
    IF NEW.is_thumbnail = TRUE THEN
        -- 같은 축제의 다른 이미지들의 썸네일 설정을 해제
        UPDATE festival_images 
        SET is_thumbnail = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE festival_id = NEW.festival_id 
        AND id != NEW.id 
        AND is_thumbnail = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_ensure_single_thumbnail
    BEFORE INSERT OR UPDATE ON festival_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_thumbnail();

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_festival_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_festival_images_updated_at
    BEFORE UPDATE ON festival_images
    FOR EACH ROW
    EXECUTE FUNCTION update_festival_images_updated_at();

-- 샘플 데이터 (테스트용)
-- INSERT INTO festival_images (
--     festival_id, 
--     original_filename, 
--     stored_filename, 
--     file_path, 
--     file_url, 
--     file_size, 
--     mime_type, 
--     width, 
--     height, 
--     is_thumbnail, 
--     display_order, 
--     alt_text, 
--     description, 
--     uploaded_by
-- ) VALUES (
--     1, 
--     'festival_main.jpg', 
--     'uuid-generated-filename.jpg', 
--     'festivals/1/uuid-generated-filename.jpg', 
--     'https://your-r2-domain.com/festivals/1/uuid-generated-filename.jpg', 
--     1024000, 
--     'image/jpeg', 
--     1920, 
--     1080, 
--     TRUE, 
--     0, 
--     '축제 메인 이미지', 
--     '2024년 제주 벚꽃 축제 메인 포스터', 
--     'admin'
-- );

-- 유용한 쿼리들

-- 1. 특정 축제의 모든 이미지 조회 (표시 순서대로)
-- SELECT * FROM festival_images 
-- WHERE festival_id = ? AND upload_status = 'uploaded' 
-- ORDER BY display_order ASC, created_at ASC;

-- 2. 특정 축제의 썸네일 이미지 조회
-- SELECT * FROM festival_images 
-- WHERE festival_id = ? AND is_thumbnail = TRUE AND upload_status = 'uploaded';

-- 3. 축제별 이미지 개수 조회
-- SELECT festival_id, COUNT(*) as image_count 
-- FROM festival_images 
-- WHERE upload_status = 'uploaded' 
-- GROUP BY festival_id;

-- 4. 이미지 표시 순서 재정렬
-- UPDATE festival_images 
-- SET display_order = ?, updated_at = CURRENT_TIMESTAMP 
-- WHERE id = ?;

-- 5. 썸네일 설정 (기존 썸네일 자동 해제됨)
-- UPDATE festival_images 
-- SET is_thumbnail = TRUE, updated_at = CURRENT_TIMESTAMP 
-- WHERE id = ? AND festival_id = ?;

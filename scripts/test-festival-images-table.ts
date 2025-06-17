// scripts/test-festival-images-table.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드 (상위 디렉토리의 .env 파일)
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFestivalImagesTable() {
  console.log('🔍 festival_images 테이블 테스트를 시작합니다...');

  try {
    // 1. 테이블 존재 여부 확인
    console.log('1. 테이블 존재 여부 확인...');
    const { data, error } = await supabase
      .from('festival_images')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ festival_images 테이블이 존재하지 않습니다.');
        console.log('📋 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
        console.log('');
        console.log(`CREATE TABLE festival_images (
  id SERIAL PRIMARY KEY,
  festival_id INTEGER NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  is_thumbnail BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  alt_text VARCHAR(500),
  description TEXT,
  upload_status VARCHAR(20) DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'failed', 'deleted')),
  uploaded_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_festival_images_festival_id ON festival_images(festival_id);
CREATE INDEX idx_festival_images_is_thumbnail ON festival_images(is_thumbnail);
CREATE INDEX idx_festival_images_display_order ON festival_images(festival_id, display_order);
CREATE INDEX idx_festival_images_upload_status ON festival_images(upload_status);
CREATE INDEX idx_festival_images_created_at ON festival_images(created_at);

-- 외래키 제약조건
ALTER TABLE festival_images 
ADD CONSTRAINT fk_festival_images_festival_id 
FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE;

-- 유니크 제약조건 (축제당 썸네일 하나만)
CREATE UNIQUE INDEX idx_festival_images_unique_thumbnail 
ON festival_images(festival_id) 
WHERE is_thumbnail = TRUE;`);
        return;
      } else {
        console.error('❌ 테이블 확인 중 오류:', error);
        return;
      }
    }

    console.log('✅ festival_images 테이블이 존재합니다.');

    // 2. 테이블 구조 확인
    console.log('2. 테이블 구조 확인...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'festival_images' })
      .select();

    if (columnsError) {
      console.log('⚠️ 테이블 구조 확인 실패 (정상적인 경우일 수 있음)');
    } else {
      console.log('✅ 테이블 구조:', columns);
    }

    // 3. 샘플 데이터 확인
    console.log('3. 기존 데이터 확인...');
    const { data: existingData, error: dataError } = await supabase
      .from('festival_images')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ 데이터 조회 오류:', dataError);
    } else {
      console.log(`✅ 기존 이미지 데이터: ${existingData?.length || 0}개`);
      if (existingData && existingData.length > 0) {
        console.log('샘플 데이터:', existingData[0]);
      }
    }

    // 4. festivals 테이블 확인
    console.log('4. festivals 테이블 확인...');
    const { data: festivals, error: festivalsError } = await supabase
      .from('festivals')
      .select('id, title')
      .limit(3);

    if (festivalsError) {
      console.error('❌ festivals 테이블 조회 오류:', festivalsError);
    } else {
      console.log(`✅ festivals 테이블: ${festivals?.length || 0}개의 축제`);
      if (festivals && festivals.length > 0) {
        console.log('샘플 축제:', festivals.map(f => `${f.id}: ${f.title}`));
      }
    }

    console.log('🎉 테이블 테스트 완료!');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 스크립트 실행
testFestivalImagesTable();

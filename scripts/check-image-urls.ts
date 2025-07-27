// scripts/check-image-urls.ts
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
const r2PublicUrl = process.env.R2_PUBLIC_URL;

if (!supabaseUrl || !supabaseServiceKey || !r2PublicUrl) {
  console.error('❌ 필요한 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImageUrls() {
  console.log('🔍 이미지 URL 확인을 시작합니다...');
  console.log('R2 Public URL:', r2PublicUrl);

  try {
    // 1. 모든 이미지 조회
    const { data: images, error } = await supabase
      .from('festival_images')
      .select('id, festival_id, original_filename, file_url, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 이미지 조회 오류:', error);
      return;
    }

    if (!images || images.length === 0) {
      console.log('📭 저장된 이미지가 없습니다.');
      return;
    }

    console.log(`📋 총 ${images.length}개의 이미지를 확인했습니다.\n`);

    // 2. 모든 이미지 URL 출력
    images.forEach((image, index) => {
      console.log(`${index + 1}. ID: ${image.id}, Festival: ${image.festival_id}`);
      console.log(`   파일명: ${image.original_filename}`);
      console.log(`   URL: ${image.file_url}`);
      console.log(`   생성일: ${image.created_at}`);
      
      // URL 분석
      if (image.file_url.includes('/grap-image/')) {
        console.log('   ⚠️  잘못된 URL: grap-image 경로 포함');
      } else if (image.file_url.includes('/grap-images/')) {
        console.log('   ⚠️  잘못된 URL: grap-images 경로 포함');
      } else if (image.file_url.includes('images.grap.co.kr')) {
        console.log('   ✅ 올바른 URL: 커스텀 도메인 사용');
      } else if (image.file_url.includes('.r2.dev')) {
        console.log('   ⚠️  R2.dev 도메인 사용 (커스텀 도메인으로 변경 권장)');
      } else {
        console.log('   ❓ 알 수 없는 URL 형식');
      }
      console.log('');
    });

    // 3. 문제가 있는 URL 통계
    const problemUrls = images.filter(img => 
      img.file_url.includes('/grap-image/') || 
      img.file_url.includes('/grap-images/') ||
      img.file_url.includes('.r2.dev')
    );

    if (problemUrls.length > 0) {
      console.log(`⚠️  문제가 있는 URL: ${problemUrls.length}개`);
      console.log('문제 유형별 분류:');
      
      const grapImageUrls = problemUrls.filter(img => img.file_url.includes('/grap-image/'));
      const grapImagesUrls = problemUrls.filter(img => img.file_url.includes('/grap-images/'));
      const r2DevUrls = problemUrls.filter(img => img.file_url.includes('.r2.dev'));
      
      if (grapImageUrls.length > 0) {
        console.log(`  - grap-image 경로 포함: ${grapImageUrls.length}개`);
      }
      if (grapImagesUrls.length > 0) {
        console.log(`  - grap-images 경로 포함: ${grapImagesUrls.length}개`);
      }
      if (r2DevUrls.length > 0) {
        console.log(`  - R2.dev 도메인 사용: ${r2DevUrls.length}개`);
      }
    } else {
      console.log('✅ 모든 이미지 URL이 올바릅니다.');
    }

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 스크립트 실행
checkImageUrls();

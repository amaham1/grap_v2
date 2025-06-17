// scripts/fix-image-urls.ts
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

async function fixImageUrls() {
  console.log('🔧 이미지 URL 수정을 시작합니다...');
  console.log('R2 Public URL:', r2PublicUrl);

  try {
    // 1. 모든 이미지 조회
    const { data: images, error } = await supabase
      .from('festival_images')
      .select('*');

    if (error) {
      console.error('❌ 이미지 조회 오류:', error);
      return;
    }

    if (!images || images.length === 0) {
      console.log('📭 수정할 이미지가 없습니다.');
      return;
    }

    console.log(`📋 총 ${images.length}개의 이미지를 확인했습니다.`);

    // 2. URL이 상대 경로이거나 잘못된 도메인인 이미지들 찾기
    const imagesToFix = images.filter(img =>
      img.file_url && (
        !img.file_url.startsWith('http') ||
        img.file_url.includes('r2.cloudflarestorage.com') ||
        img.file_url.includes('pub-82da20568b30724b79be07d76b86ebe5.r2.dev') ||
        img.file_url.includes('pub-9ff6cd90524e49408d5bd12d36b26bd7.r2.dev') ||
        img.file_url.includes('/grap-image/') ||
        img.file_url.includes('/grap-images/')
      )
    );

    if (imagesToFix.length === 0) {
      console.log('✅ 모든 이미지 URL이 이미 올바릅니다.');
      return;
    }

    console.log(`🔧 ${imagesToFix.length}개의 이미지 URL을 수정합니다.`);

    // 3. 각 이미지 URL 수정
    for (const image of imagesToFix) {
      const oldUrl = image.file_url;

      let relativePath = '';
      if (oldUrl.startsWith('/')) {
        // 상대 경로인 경우
        relativePath = oldUrl.substring(1);
      } else if (oldUrl.includes('r2.cloudflarestorage.com')) {
        // 기존 R2 URL에서 경로 추출
        const pathMatch = oldUrl.match(/\/(.+)$/);
        relativePath = pathMatch ? pathMatch[1] : oldUrl;
      } else if (oldUrl.includes('.r2.dev/')) {
        // 기존 R2.dev URL에서 경로 추출
        const pathMatch = oldUrl.match(/\.r2\.dev\/(.+)$/);
        relativePath = pathMatch ? pathMatch[1] : oldUrl;
      } else {
        relativePath = oldUrl;
      }

      const newUrl = `${r2PublicUrl}/${relativePath}`;

      console.log(`📝 ID ${image.id}: ${oldUrl} → ${newUrl}`);

      const { error: updateError } = await supabase
        .from('festival_images')
        .update({ 
          file_url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', image.id);

      if (updateError) {
        console.error(`❌ ID ${image.id} 업데이트 실패:`, updateError);
      } else {
        console.log(`✅ ID ${image.id} 업데이트 완료`);
      }
    }

    console.log('🎉 이미지 URL 수정이 완료되었습니다!');

    // 4. 수정 결과 확인
    console.log('\n📊 수정 결과 확인...');
    const { data: updatedImages, error: checkError } = await supabase
      .from('festival_images')
      .select('id, file_url')
      .limit(5);

    if (checkError) {
      console.error('❌ 결과 확인 오류:', checkError);
    } else {
      console.log('샘플 수정된 URL들:');
      updatedImages?.forEach(img => {
        console.log(`  ID ${img.id}: ${img.file_url}`);
      });
    }

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 스크립트 실행
fixImageUrls();

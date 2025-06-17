// scripts/test-r2-access.ts
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드 (상위 디렉토리의 .env 파일)
dotenv.config({ path: path.join(__dirname, '../.env') });

const r2Config = {
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  endpoint: process.env.R2_ENDPOINT || '',
  bucket: process.env.R2_BUCKET_NAME || '',
  publicUrl: process.env.R2_PUBLIC_URL || ''
};

if (!r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.endpoint || !r2Config.bucket) {
  console.error('❌ R2 설정이 완료되지 않았습니다.');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: r2Config.endpoint,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

async function testR2Access() {
  console.log('🔍 Cloudflare R2 접근 테스트를 시작합니다...');
  console.log('설정 정보:');
  console.log('- Endpoint:', r2Config.endpoint);
  console.log('- Bucket:', r2Config.bucket);
  console.log('- Public URL:', r2Config.publicUrl);

  try {
    // 1. 버킷 내 파일 목록 조회
    console.log('\n1. 버킷 내 파일 목록 조회...');
    const listCommand = new ListObjectsV2Command({
      Bucket: r2Config.bucket,
      Prefix: 'festivals/',
      MaxKeys: 10
    });

    const listResult = await client.send(listCommand);
    
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log(`✅ ${listResult.Contents.length}개의 파일을 찾았습니다:`);
      listResult.Contents.forEach(obj => {
        console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log('📭 버킷에 파일이 없습니다.');
    }

    // 2. 특정 파일 존재 여부 확인
    const testFilePath = 'festivals/472/ab5feef7-bbc0-4e75-af4a-29d30ea201af.jpg';
    console.log(`\n2. 특정 파일 존재 여부 확인: ${testFilePath}`);
    
    try {
      const getCommand = new GetObjectCommand({
        Bucket: r2Config.bucket,
        Key: testFilePath
      });

      const getResult = await client.send(getCommand);
      console.log('✅ 파일이 존재합니다.');
      console.log('- Content Type:', getResult.ContentType);
      console.log('- Content Length:', getResult.ContentLength);
      console.log('- Last Modified:', getResult.LastModified);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        console.log('❌ 파일이 존재하지 않습니다.');
      } else {
        console.error('❌ 파일 확인 중 오류:', error.message);
      }
    }

    // 3. 퍼블릭 URL 테스트
    console.log('\n3. 퍼블릭 URL 테스트...');
    const publicUrl = `${r2Config.publicUrl}/${testFilePath}`;
    console.log('테스트 URL:', publicUrl);
    
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log('✅ 퍼블릭 URL 접근 가능');
        console.log('- Status:', response.status);
        console.log('- Content-Type:', response.headers.get('content-type'));
        console.log('- Content-Length:', response.headers.get('content-length'));
      } else {
        console.log('❌ 퍼블릭 URL 접근 실패');
        console.log('- Status:', response.status);
        console.log('- Status Text:', response.statusText);
      }
    } catch (error: any) {
      console.error('❌ 퍼블릭 URL 테스트 오류:', error.message);
    }

    // 4. 테스트 파일 업로드
    console.log('\n4. 테스트 파일 업로드...');
    const testContent = 'Hello from R2 test!';
    const testKey = 'test/test-file.txt';
    
    try {
      const putCommand = new PutObjectCommand({
        Bucket: r2Config.bucket,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
        // 퍼블릭 읽기 권한 설정 시도
        ACL: 'public-read'
      });

      await client.send(putCommand);
      console.log('✅ 테스트 파일 업로드 성공');
      
      // 업로드된 파일 퍼블릭 URL 테스트
      const testPublicUrl = `${r2Config.publicUrl}/${testKey}`;
      console.log('테스트 파일 URL:', testPublicUrl);
      
      const testResponse = await fetch(testPublicUrl);
      if (testResponse.ok) {
        const content = await testResponse.text();
        console.log('✅ 테스트 파일 퍼블릭 접근 성공:', content);
      } else {
        console.log('❌ 테스트 파일 퍼블릭 접근 실패:', testResponse.status);
      }
      
    } catch (error: any) {
      console.error('❌ 테스트 파일 업로드 오류:', error.message);
    }

    console.log('\n🎉 R2 접근 테스트 완료!');

  } catch (error: any) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 스크립트 실행
testR2Access();

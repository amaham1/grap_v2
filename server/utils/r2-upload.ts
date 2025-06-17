// server/utils/r2-upload.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { R2UploadConfig, R2UploadResult } from '~/server/types/image';

/**
 * Cloudflare R2 클라이언트 생성
 */
function createR2Client(config: R2UploadConfig): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * R2 설정 가져오기
 */
function getR2Config(): R2UploadConfig {
  const runtimeConfig = useRuntimeConfig();
  
  // Cloudflare Workers 환경에서는 바인딩을 통해 접근
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS) {
    return {
      bucket: process.env.R2_BUCKET_NAME || 'grap-images',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      endpoint: process.env.R2_ENDPOINT || '',
      publicUrl: process.env.R2_PUBLIC_URL || '',
    };
  }
  
  // 로컬 개발 환경
  return {
    bucket: process.env.R2_BUCKET_NAME || 'grap-images-preview',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    endpoint: process.env.R2_ENDPOINT || '',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  };
}

/**
 * 파일을 R2에 업로드
 */
export async function uploadToR2(
  buffer: Buffer,
  filePath: string,
  mimeType: string,
  metadata?: Record<string, string>
): Promise<R2UploadResult> {
  try {
    const config = getR2Config();
    
    if (!config.accessKeyId || !config.secretAccessKey || !config.endpoint) {
      throw new Error('R2 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.');
    }
    
    const client = createR2Client(config);
    
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
      // 퍼블릭 읽기 권한 설정
      ACL: 'public-read',
    });
    
    await client.send(command);
    
    // 파일 URL 생성
    let fileUrl = `${config.publicUrl}/${filePath}`;

    // R2.dev 서브도메인을 사용하는 경우 버킷명 추가하지 않음
    if (config.publicUrl.includes('.r2.dev')) {
      fileUrl = `${config.publicUrl}/${filePath}`;
    } else if (!config.publicUrl.includes(config.bucket)) {
      // 기존 방식: publicUrl이 버킷명을 포함하지 않는 경우 추가
      fileUrl = `${config.publicUrl}/${config.bucket}/${filePath}`;
    }
    
    return {
      success: true,
      file_path: filePath,
      file_url: fileUrl,
      file_size: buffer.length,
    };
    
  } catch (error: any) {
    console.error('R2 업로드 오류:', error);
    return {
      success: false,
      file_path: filePath,
      file_url: '',
      file_size: 0,
      error: error.message || 'R2 업로드 중 오류가 발생했습니다.',
    };
  }
}

/**
 * R2에서 파일 삭제
 */
export async function deleteFromR2(filePath: string): Promise<boolean> {
  try {
    const config = getR2Config();
    const client = createR2Client(config);
    
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: filePath,
    });
    
    await client.send(command);
    return true;
    
  } catch (error: any) {
    console.error('R2 파일 삭제 오류:', error);
    return false;
  }
}

/**
 * R2 파일 존재 여부 확인
 */
export async function checkR2FileExists(filePath: string): Promise<boolean> {
  try {
    const config = getR2Config();
    const client = createR2Client(config);
    
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: filePath,
    });
    
    await client.send(command);
    return true;
    
  } catch (error: any) {
    return false;
  }
}

/**
 * 파일 경로 생성 (축제 ID와 파일명 기반)
 */
export function generateFilePath(festivalId: number, filename: string, isThumb: boolean = false): string {
  const folder = isThumb ? 'thumbnails' : '';
  const basePath = `festivals/${festivalId}`;
  
  if (folder) {
    return `${basePath}/${folder}/${filename}`;
  }
  
  return `${basePath}/${filename}`;
}

/**
 * UUID 기반 파일명 생성
 */
export function generateStoredFilename(originalFilename: string): string {
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const uuid = crypto.randomUUID();
  return `${uuid}.${extension}`;
}

/**
 * 이미지 MIME 타입 검증
 */
export function validateImageMimeType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * 파일 크기 검증 (10MB 제한)
 */
export function validateFileSize(size: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}

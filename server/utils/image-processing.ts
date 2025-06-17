// server/utils/image-processing.ts
import type { ImageProcessingOptions, ProcessedImageResult } from '~/server/types/image';

// Sharp 동적 import로 처리하여 오류 방지
let sharp: any = null;

async function getSharp() {
  if (!sharp) {
    try {
      sharp = (await import('sharp')).default;
    } catch (error) {
      console.warn('Sharp 라이브러리를 로드할 수 없습니다. 이미지 처리 기능이 제한됩니다:', error);
      return null;
    }
  }
  return sharp;
}

/**
 * 이미지 처리 (리사이징, 압축, 썸네일 생성)
 */
export async function processImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const sharpLib = await getSharp();

  if (!sharpLib) {
    // Sharp가 없는 경우 원본 이미지 그대로 반환
    return {
      original: {
        buffer: buffer,
        width: 0,
        height: 0,
        size: buffer.length
      }
    };
  }

  try {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'jpeg',
      generateThumbnail = true,
      thumbnailSize = 300
    } = options;

    // 원본 이미지 정보 가져오기
    const metadata = await sharpLib(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 메타데이터를 읽을 수 없습니다.');
    }

    // 원본 이미지 처리 (리사이징 및 압축)
    let processedImage = sharpLib(buffer);

    // 크기 조정이 필요한 경우
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      processedImage = processedImage.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // 포맷 및 품질 설정
    if (format === 'jpeg') {
      processedImage = processedImage.jpeg({ quality });
    } else if (format === 'png') {
      processedImage = processedImage.png({ quality });
    } else if (format === 'webp') {
      processedImage = processedImage.webp({ quality });
    }

    const processedBuffer = await processedImage.toBuffer();
    const processedMetadata = await sharpLib(processedBuffer).metadata();

    const result: ProcessedImageResult = {
      original: {
        buffer: processedBuffer,
        width: processedMetadata.width || metadata.width,
        height: processedMetadata.height || metadata.height,
        size: processedBuffer.length
      }
    };

    // 썸네일 생성
    if (generateThumbnail) {
      const thumbnailBuffer = await sharpLib(buffer)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailMetadata = await sharpLib(thumbnailBuffer).metadata();

      result.thumbnail = {
        buffer: thumbnailBuffer,
        width: thumbnailMetadata.width || thumbnailSize,
        height: thumbnailMetadata.height || thumbnailSize,
        size: thumbnailBuffer.length
      };
    }

    return result;

  } catch (error: any) {
    console.error('이미지 처리 오류:', error);
    throw new Error(`이미지 처리 중 오류가 발생했습니다: ${error.message}`);
  }
}

/**
 * 이미지 메타데이터 추출
 */
export async function getImageMetadata(buffer: Buffer) {
  const sharpLib = await getSharp();

  if (!sharpLib) {
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      size: buffer.length,
      hasAlpha: false,
      channels: 0
    };
  }

  try {
    const metadata = await sharpLib(buffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
      channels: metadata.channels || 0
    };
  } catch (error: any) {
    console.error('이미지 메타데이터 추출 오류:', error);
    throw new Error('이미지 메타데이터를 읽을 수 없습니다.');
  }
}

/**
 * 이미지 포맷 검증
 */
export async function validateImageFormat(buffer: Buffer): Promise<boolean> {
  const sharpLib = await getSharp();

  if (!sharpLib) {
    // Sharp가 없는 경우 기본적으로 true 반환 (다른 검증에 의존)
    return true;
  }

  try {
    const metadata = await sharpLib(buffer).metadata();
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];

    return allowedFormats.includes(metadata.format || '');
  } catch (error) {
    return false;
  }
}

/**
 * 이미지 압축 (품질 조정)
 */
export async function compressImage(
  buffer: Buffer,
  quality: number = 85,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): Promise<Buffer> {
  const sharpLib = await getSharp();

  if (!sharpLib) {
    // Sharp가 없는 경우 원본 반환
    return buffer;
  }

  try {
    let processedImage = sharpLib(buffer);

    if (format === 'jpeg') {
      processedImage = processedImage.jpeg({ quality });
    } else if (format === 'png') {
      processedImage = processedImage.png({ quality });
    } else if (format === 'webp') {
      processedImage = processedImage.webp({ quality });
    }

    return await processedImage.toBuffer();
  } catch (error: any) {
    console.error('이미지 압축 오류:', error);
    throw new Error(`이미지 압축 중 오류가 발생했습니다: ${error.message}`);
  }
}

/**
 * 썸네일 생성
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: number = 300,
  quality: number = 80
): Promise<Buffer> {
  const sharpLib = await getSharp();

  if (!sharpLib) {
    // Sharp가 없는 경우 원본 반환
    return buffer;
  }

  try {
    return await sharpLib(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toBuffer();
  } catch (error: any) {
    console.error('썸네일 생성 오류:', error);
    throw new Error(`썸네일 생성 중 오류가 발생했습니다: ${error.message}`);
  }
}

/**
 * 이미지 리사이징
 */
export async function resizeImage(
  buffer: Buffer,
  width?: number,
  height?: number,
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'inside'
): Promise<Buffer> {
  const sharpLib = await getSharp();

  if (!sharpLib) {
    // Sharp가 없는 경우 원본 반환
    return buffer;
  }

  try {
    return await sharpLib(buffer)
      .resize(width, height, { fit, withoutEnlargement: true })
      .toBuffer();
  } catch (error: any) {
    console.error('이미지 리사이징 오류:', error);
    throw new Error(`이미지 리사이징 중 오류가 발생했습니다: ${error.message}`);
  }
}

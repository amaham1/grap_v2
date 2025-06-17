// server/api/admin/festivals/upload-image.post.ts
import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { 
  createFestivalImage, 
  getFestivalImageCount, 
  getNextDisplayOrder 
} from '~/server/dao/supabase/festival-image-dao';
import { getFestivalById } from '~/server/dao/supabase/festival-dao';
import { uploadToR2, generateFilePath, generateStoredFilename, validateImageMimeType, validateFileSize } from '~/server/utils/r2-upload';
import { processImage, getImageMetadata } from '~/server/utils/image-processing';
import type { ImageUploadResponse } from '~/server/types/image';

const MAX_IMAGES_PER_FESTIVAL = 20;

export default defineEventHandler(async (event): Promise<ImageUploadResponse> => {
  try {
    // 멀티파트 폼 데이터 읽기
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '업로드할 파일이 없습니다.'
      });
    }

    // 폼 데이터에서 필요한 정보 추출
    let festivalId: number | null = null;
    let fileData: any = null;
    let altText: string = '';
    let description: string = '';
    let isThumbnail: boolean = false;

    for (const item of formData) {
      if (item.name === 'festival_id' && item.data) {
        festivalId = parseInt(item.data.toString());
      } else if (item.name === 'file' && item.data) {
        fileData = item;
      } else if (item.name === 'alt_text' && item.data) {
        altText = item.data.toString();
      } else if (item.name === 'description' && item.data) {
        description = item.data.toString();
      } else if (item.name === 'is_thumbnail' && item.data) {
        isThumbnail = item.data.toString() === 'true';
      }
    }

    // 유효성 검사
    if (!festivalId) {
      throw createError({
        statusCode: 400,
        statusMessage: '축제 ID가 필요합니다.'
      });
    }

    if (!fileData || !fileData.data) {
      throw createError({
        statusCode: 400,
        statusMessage: '업로드할 파일이 없습니다.'
      });
    }

    // 축제 존재 여부 확인
    const festival = await getFestivalById(festivalId);
    if (!festival) {
      throw createError({
        statusCode: 404,
        statusMessage: '존재하지 않는 축제입니다.'
      });
    }

    // 파일 정보 검증
    const originalFilename = fileData.filename || 'unknown.jpg';
    const mimeType = fileData.type || 'image/jpeg';
    const fileBuffer = Buffer.from(fileData.data);

    // MIME 타입 검증
    if (!validateImageMimeType(mimeType)) {
      throw createError({
        statusCode: 400,
        statusMessage: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 지원)'
      });
    }

    // 파일 크기 검증
    if (!validateFileSize(fileBuffer.length)) {
      throw createError({
        statusCode: 400,
        statusMessage: '파일 크기가 너무 큽니다. (최대 10MB)'
      });
    }

    // 축제당 이미지 개수 제한 확인
    const currentImageCount = await getFestivalImageCount(festivalId);
    if (currentImageCount >= MAX_IMAGES_PER_FESTIVAL) {
      throw createError({
        statusCode: 400,
        statusMessage: `축제당 최대 ${MAX_IMAGES_PER_FESTIVAL}개의 이미지만 업로드할 수 있습니다.`
      });
    }

    // 이미지 메타데이터 추출
    const metadata = await getImageMetadata(fileBuffer);

    // 이미지 처리 (리사이징, 압축)
    const processedImage = await processImage(fileBuffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'jpeg',
      generateThumbnail: false // 썸네일은 별도로 생성하지 않음
    });

    // 저장할 파일명 생성
    const storedFilename = generateStoredFilename(originalFilename);
    const filePath = generateFilePath(festivalId, storedFilename);

    // R2에 업로드
    const uploadResult = await uploadToR2(
      processedImage.original.buffer,
      filePath,
      'image/jpeg',
      {
        'original-filename': originalFilename,
        'festival-id': festivalId.toString(),
        'uploaded-at': new Date().toISOString()
      }
    );

    if (!uploadResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage: uploadResult.error || '파일 업로드에 실패했습니다.'
      });
    }

    // 표시 순서 가져오기
    const displayOrder = await getNextDisplayOrder(festivalId);

    // 데이터베이스에 이미지 정보 저장
    const imageData = {
      festival_id: festivalId,
      original_filename: originalFilename,
      stored_filename: storedFilename,
      file_path: uploadResult.file_path,
      file_url: uploadResult.file_url,
      file_size: processedImage.original.size,
      mime_type: 'image/jpeg',
      width: processedImage.original.width,
      height: processedImage.original.height,
      is_thumbnail: isThumbnail,
      display_order: displayOrder,
      alt_text: altText || '',
      description: description || '',
      upload_status: 'uploaded' as const,
      uploaded_by: 'admin' // TODO: 실제 사용자 정보로 교체
    };

    const dbResult = await createFestivalImage(imageData);

    if (dbResult.error) {
      // 업로드된 파일 삭제 시도
      try {
        await uploadToR2(Buffer.from(''), filePath, 'text/plain'); // 삭제 시도
      } catch (cleanupError) {
        console.error('업로드된 파일 정리 실패:', cleanupError);
      }

      throw createError({
        statusCode: 500,
        statusMessage: '이미지 정보 저장에 실패했습니다.'
      });
    }

    const savedImage = dbResult.data?.[0];

    return {
      success: true,
      message: '이미지가 성공적으로 업로드되었습니다.',
      data: {
        id: savedImage?.id || 0,
        file_url: uploadResult.file_url,
        file_path: uploadResult.file_path,
        original_filename: originalFilename,
        stored_filename: storedFilename,
        file_size: processedImage.original.size,
        mime_type: 'image/jpeg',
        width: processedImage.original.width,
        height: processedImage.original.height,
        is_thumbnail: isThumbnail,
        display_order: displayOrder
      }
    };

  } catch (error: any) {
    console.error('이미지 업로드 API 오류:', error);

    // createError로 생성된 오류는 그대로 전달
    if (error.statusCode) {
      throw error;
    }

    // 기타 예상치 못한 오류
    throw createError({
      statusCode: 500,
      statusMessage: '이미지 업로드 중 서버 오류가 발생했습니다.'
    });
  }
});

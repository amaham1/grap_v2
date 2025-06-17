// server/dao/supabase/festival-image-dao.ts
import { executeSupabaseQuery } from '~/server/utils/supabase';
import type { FestivalImage } from '~/server/types/image';

/**
 * 축제 이미지 생성
 */
export async function createFestivalImage(imageData: Omit<FestivalImage, 'id' | 'created_at' | 'updated_at'>) {
  const data = {
    ...imageData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return await executeSupabaseQuery('festival_images', 'insert', {
    data
  });
}

/**
 * 특정 축제의 모든 이미지 조회
 */
export async function getFestivalImages(festivalId: number, includeDeleted: boolean = false) {
  const filters: any = { festival_id: festivalId };
  
  if (!includeDeleted) {
    filters.upload_status = 'uploaded';
  }

  const result = await executeSupabaseQuery<FestivalImage>('festival_images', 'select', {
    filters,
    orderBy: [
      { column: 'display_order', ascending: true },
      { column: 'created_at', ascending: true }
    ]
  });

  return result;
}

/**
 * 특정 축제의 썸네일 이미지 조회
 */
export async function getFestivalThumbnail(festivalId: number) {
  const result = await executeSupabaseQuery<FestivalImage>('festival_images', 'select', {
    filters: {
      festival_id: festivalId,
      is_thumbnail: true,
      upload_status: 'uploaded'
    },
    limit: 1
  });

  return result.data?.[0] || null;
}

/**
 * 이미지 ID로 조회
 */
export async function getFestivalImageById(id: number) {
  const result = await executeSupabaseQuery<FestivalImage>('festival_images', 'select', {
    filters: { id }
  });

  return result.data?.[0] || null;
}

/**
 * 이미지 정보 업데이트
 */
export async function updateFestivalImage(id: number, updateData: Partial<FestivalImage>) {
  const data = {
    ...updateData,
    updated_at: new Date().toISOString()
  };

  return await executeSupabaseQuery('festival_images', 'update', {
    filters: { id },
    data
  });
}

/**
 * 썸네일 설정 (기존 썸네일 해제 후 새 썸네일 설정)
 */
export async function setFestivalThumbnail(festivalId: number, imageId: number) {
  try {
    // 1. 기존 썸네일 해제
    await executeSupabaseQuery('festival_images', 'update', {
      filters: {
        festival_id: festivalId,
        is_thumbnail: true
      },
      data: {
        is_thumbnail: false,
        updated_at: new Date().toISOString()
      }
    });

    // 2. 새 썸네일 설정
    const result = await executeSupabaseQuery('festival_images', 'update', {
      filters: {
        id: imageId,
        festival_id: festivalId
      },
      data: {
        is_thumbnail: true,
        updated_at: new Date().toISOString()
      }
    });

    return result;
  } catch (error: any) {
    console.error('썸네일 설정 오류:', error);
    throw error;
  }
}

/**
 * 이미지 표시 순서 업데이트
 */
export async function updateImageDisplayOrder(imageId: number, displayOrder: number) {
  return await executeSupabaseQuery('festival_images', 'update', {
    filters: { id: imageId },
    data: {
      display_order: displayOrder,
      updated_at: new Date().toISOString()
    }
  });
}

/**
 * 이미지 삭제 (소프트 삭제)
 */
export async function deleteFestivalImage(id: number) {
  return await executeSupabaseQuery('festival_images', 'update', {
    filters: { id },
    data: {
      upload_status: 'deleted',
      updated_at: new Date().toISOString()
    }
  });
}

/**
 * 이미지 완전 삭제 (하드 삭제)
 */
export async function hardDeleteFestivalImage(id: number) {
  return await executeSupabaseQuery('festival_images', 'delete', {
    filters: { id }
  });
}

/**
 * 축제의 이미지 개수 조회
 */
export async function getFestivalImageCount(festivalId: number) {
  const result = await executeSupabaseQuery('festival_images', 'select', {
    select: 'id',
    filters: {
      festival_id: festivalId,
      upload_status: 'uploaded'
    }
  });

  return result.count || 0;
}

/**
 * 축제의 다음 표시 순서 가져오기
 */
export async function getNextDisplayOrder(festivalId: number): Promise<number> {
  const result = await executeSupabaseQuery<{ display_order: number }>('festival_images', 'select', {
    select: 'display_order',
    filters: {
      festival_id: festivalId,
      upload_status: 'uploaded'
    },
    orderBy: [{ column: 'display_order', ascending: false }],
    limit: 1
  });

  const maxOrder = result.data?.[0]?.display_order || -1;
  return maxOrder + 1;
}

/**
 * 축제 이미지 일괄 순서 업데이트
 */
export async function updateImageOrders(updates: Array<{ id: number; display_order: number }>) {
  try {
    const promises = updates.map(update =>
      updateImageDisplayOrder(update.id, update.display_order)
    );

    const results = await Promise.all(promises);
    return results.every(result => !result.error);
  } catch (error: any) {
    console.error('이미지 순서 일괄 업데이트 오류:', error);
    return false;
  }
}

/**
 * 업로드 상태별 이미지 조회
 */
export async function getImagesByStatus(status: 'uploading' | 'uploaded' | 'failed' | 'deleted') {
  const result = await executeSupabaseQuery<FestivalImage>('festival_images', 'select', {
    filters: { upload_status: status },
    orderBy: [{ column: 'created_at', ascending: false }]
  });

  return result;
}

/**
 * 실패한 업로드 정리 (24시간 이상 된 uploading 상태 이미지)
 */
export async function cleanupFailedUploads() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return await executeSupabaseQuery('festival_images', 'update', {
    filters: {
      upload_status: 'uploading',
      created_at: { lt: oneDayAgo }
    },
    data: {
      upload_status: 'failed',
      updated_at: new Date().toISOString()
    }
  });
}

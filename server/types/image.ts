// server/types/image.ts
export interface FestivalImage {
  id?: number;
  festival_id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  is_thumbnail: boolean;
  display_order: number;
  alt_text?: string;
  description?: string;
  upload_status: 'uploading' | 'uploaded' | 'failed' | 'deleted';
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImageUploadRequest {
  festival_id: number;
  file: File;
  alt_text?: string;
  description?: string;
  is_thumbnail?: boolean;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    file_url: string;
    file_path: string;
    original_filename: string;
    stored_filename: string;
    file_size: number;
    mime_type: string;
    width?: number;
    height?: number;
    is_thumbnail: boolean;
    display_order: number;
  };
  error?: string;
}

export interface ImageListResponse {
  success: boolean;
  data: FestivalImage[];
  total: number;
  message?: string;
  error?: string;
}

export interface ImageUpdateRequest {
  id: number;
  alt_text?: string;
  description?: string;
  is_thumbnail?: boolean;
  display_order?: number;
}

export interface ImageDeleteRequest {
  id: number;
  festival_id: number;
}

// R2 업로드 관련 타입
export interface R2UploadConfig {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  publicUrl: string;
}

export interface R2UploadResult {
  success: boolean;
  file_path: string;
  file_url: string;
  file_size: number;
  error?: string;
}

// 이미지 처리 관련 타입
export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ProcessedImageResult {
  original: {
    buffer: Buffer;
    width: number;
    height: number;
    size: number;
  };
  thumbnail?: {
    buffer: Buffer;
    width: number;
    height: number;
    size: number;
  };
}

// 허용되는 이미지 타입
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGES_PER_FESTIVAL = 20;
export const THUMBNAIL_SIZE = 300; // 썸네일 최대 크기 (픽셀)

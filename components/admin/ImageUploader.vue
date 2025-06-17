<template>
  <div class="image-uploader">
    <!-- 업로드 영역 -->
    <div 
      class="upload-zone"
      :class="{ 
        'drag-over': isDragOver, 
        'uploading': isUploading,
        'has-error': uploadError 
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        @change="handleFileSelect"
        class="hidden"
      />
      
      <div class="upload-content">
        <div v-if="isUploading" class="uploading-state">
          <svg class="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-lg font-medium text-gray-700">이미지 업로드 중...</p>
          <p class="text-sm text-gray-500">{{ uploadProgress }}</p>
        </div>
        
        <div v-else class="upload-prompt">
          <svg class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-lg font-medium text-gray-700 mb-2">이미지를 업로드하세요</p>
          <p class="text-sm text-gray-500 mb-4">
            파일을 드래그하여 놓거나 클릭하여 선택하세요
          </p>
          <p class="text-xs text-gray-400">
            지원 형식: JPEG, PNG, WebP (최대 10MB)
          </p>
        </div>
      </div>
    </div>

    <!-- 오류 메시지 -->
    <div v-if="uploadError" class="error-message">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-red-700">{{ uploadError }}</span>
      </div>
    </div>

    <!-- 업로드된 이미지 목록 -->
    <div v-if="images.length > 0" class="images-grid">
      <h4 class="text-lg font-medium text-gray-900 mb-4">
        업로드된 이미지 ({{ images.length }}개)
      </h4>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
          v-for="(image, index) in images" 
          :key="image.id"
          class="image-item"
          :class="{ 'is-thumbnail': image.is_thumbnail }"
        >
          <!-- 이미지 미리보기 -->
          <div class="image-preview">
            <img
              :src="image.file_url"
              :alt="image.alt_text || image.original_filename"
              class="w-full h-32 object-cover rounded-lg"
              @error="(e) => handleImageError(e, image)"
              @load="(e) => handleImageLoad(e, image)"
            />
            
            <!-- 썸네일 배지 -->
            <div v-if="image.is_thumbnail" class="thumbnail-badge">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span class="text-xs">썸네일</span>
            </div>

            <!-- 로딩 오버레이 -->
            <div v-if="image.uploading" class="loading-overlay">
              <svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>

          <!-- 이미지 정보 -->
          <div class="image-info">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ image.original_filename }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatFileSize(image.file_size) }} • {{ image.width }}×{{ image.height }}
            </p>
          </div>

          <!-- 액션 버튼 -->
          <div class="image-actions">
            <button
              @click="setThumbnail(image.id)"
              :disabled="image.is_thumbnail"
              class="action-btn thumbnail-btn"
              :class="{ 'active': image.is_thumbnail }"
              title="썸네일로 설정"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            
            <button
              @click="deleteImage(image.id)"
              class="action-btn delete-btn"
              title="이미지 삭제"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface ImageData {
  id: number;
  original_filename: string;
  file_url: string;
  file_size: number;
  width: number;
  height: number;
  is_thumbnail: boolean;
  display_order: number;
  uploading?: boolean;
}

interface Props {
  festivalId: number;
  maxImages?: number;
}

interface Emits {
  (e: 'upload-success', image: ImageData): void;
  (e: 'upload-error', error: string): void;
  (e: 'delete-success', imageId: number): void;
  (e: 'thumbnail-changed', imageId: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxImages: 20
});

const emit = defineEmits<Emits>();

// 상태 관리
const fileInput = ref<HTMLInputElement>();
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadProgress = ref('');
const uploadError = ref('');
const images = ref<ImageData[]>([]);

// 드래그 앤 드롭 핸들러
function handleDragOver(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = true;
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;
  
  const files = Array.from(e.dataTransfer?.files || []);
  handleFiles(files);
}

// 파일 선택 핸들러
function triggerFileInput() {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  handleFiles(files);
  
  // 입력 초기화
  target.value = '';
}

// 파일 처리
async function handleFiles(files: File[]) {
  if (files.length === 0) return;
  
  // 이미지 개수 제한 확인
  if (images.value.length + files.length > props.maxImages) {
    uploadError.value = `최대 ${props.maxImages}개의 이미지만 업로드할 수 있습니다.`;
    return;
  }
  
  uploadError.value = '';
  
  for (const file of files) {
    await uploadFile(file);
  }
}

// 파일 업로드
async function uploadFile(file: File) {
  // 파일 유효성 검사
  if (!validateFile(file)) {
    return;
  }
  
  isUploading.value = true;
  uploadProgress.value = `${file.name} 업로드 중...`;
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('festival_id', props.festivalId.toString());
    formData.append('alt_text', '');
    formData.append('description', '');
    formData.append('is_thumbnail', 'false');
    
    const response = await $fetch('/api/admin/festivals/upload-image', {
      method: 'POST',
      body: formData
    });
    
    if (response.success && response.data) {
      const newImage: ImageData = {
        id: response.data.id,
        original_filename: response.data.original_filename,
        file_url: response.data.file_url,
        file_size: response.data.file_size,
        width: response.data.width || 0,
        height: response.data.height || 0,
        is_thumbnail: response.data.is_thumbnail,
        display_order: response.data.display_order
      };
      
      images.value.push(newImage);
      emit('upload-success', newImage);
    } else {
      throw new Error(response.message || '업로드에 실패했습니다.');
    }
    
  } catch (error: any) {
    console.error('파일 업로드 오류:', error);
    const errorMessage = error.data?.statusMessage || error.message || '업로드 중 오류가 발생했습니다.';
    uploadError.value = errorMessage;
    emit('upload-error', errorMessage);
  } finally {
    isUploading.value = false;
    uploadProgress.value = '';
  }
}

// 파일 유효성 검사
function validateFile(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 지원)';
    return false;
  }
  
  if (file.size > maxSize) {
    uploadError.value = '파일 크기가 너무 큽니다. (최대 10MB)';
    return false;
  }
  
  return true;
}

// 썸네일 설정
async function setThumbnail(imageId: number) {
  try {
    const response = await $fetch(`/api/admin/festivals/images/${imageId}`, {
      method: 'PUT',
      body: { is_thumbnail: true }
    });
    
    if (response.success) {
      // 기존 썸네일 해제
      images.value.forEach(img => {
        img.is_thumbnail = img.id === imageId;
      });
      
      emit('thumbnail-changed', imageId);
    }
  } catch (error: any) {
    console.error('썸네일 설정 오류:', error);
    uploadError.value = '썸네일 설정에 실패했습니다.';
  }
}

// 이미지 삭제
async function deleteImage(imageId: number) {
  if (!confirm('이미지를 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await $fetch(`/api/admin/festivals/images/${imageId}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      images.value = images.value.filter(img => img.id !== imageId);
      emit('delete-success', imageId);
    }
  } catch (error: any) {
    console.error('이미지 삭제 오류:', error);
    uploadError.value = '이미지 삭제에 실패했습니다.';
  }
}

// 이미지 로드 성공 처리
function handleImageLoad(e: Event, image: ImageData) {
  console.log('✅ 이미지 로드 성공:', image.original_filename, image.file_url);
}

// 이미지 로드 오류 처리
function handleImageError(e: Event, image: ImageData) {
  const img = e.target as HTMLImageElement;
  console.error('❌ 이미지 로드 실패:', image.original_filename, image.file_url);

  // CORS 오류인지 확인
  console.log('이미지 URL 직접 테스트:', image.file_url);

  // 간단한 SVG 플레이스홀더로 대체
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NS4zMzMzIDUzLjMzMzNDODUuMzMzMyA1Ny4wMTUyIDgyLjM0ODUgNjAgNzguNjY2NyA2MEM3NC45ODQ4IDYwIDcyIDU3LjAxNTIgNzIgNTMuMzMzM0M3MiA0OS42NTE1IDc0Ljk4NDggNDYuNjY2NyA3OC42NjY3IDQ2LjY2NjdDODIuMzQ4NSA0Ni42NjY3IDg1LjMzMzMgNDkuNjUxNSA4NS4zMzMzIDUzLjMzMzNaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik02NCA4MEwxMzYgODBMMTI4IDY0TDEwNCA3Mkg5Nkw4MCA2NEw2NCA4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';

  // 오류 메시지 표시
  uploadError.value = `이미지 로드 실패: ${image.original_filename}. Cloudflare R2 설정을 확인해주세요.`;
}

// 파일 크기 포맷팅
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 이미지 목록 로드
async function loadImages() {
  try {
    console.log('이미지 목록 로드 시작:', props.festivalId);
    const response = await $fetch(`/api/admin/festivals/${props.festivalId}/images`);

    console.log('이미지 목록 응답:', response);

    if (response.success) {
      images.value = response.data || [];
      console.log('로드된 이미지 개수:', images.value.length);
    } else {
      console.error('이미지 목록 로드 실패:', response.message);
      uploadError.value = response.message || '이미지 목록을 불러올 수 없습니다.';
    }
  } catch (error: any) {
    console.error('이미지 목록 로드 오류:', error);
    uploadError.value = error.data?.statusMessage || error.message || '이미지 목록을 불러오는 중 오류가 발생했습니다.';
  }
}

// 컴포넌트 마운트 시 이미지 목록 로드
onMounted(() => {
  loadImages();
});

// 외부에서 접근 가능한 메서드
defineExpose({
  loadImages,
  uploadFile
});
</script>

<style scoped>
.image-uploader {
  @apply space-y-6;
}

.upload-zone {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all duration-200;
}

.upload-zone:hover {
  @apply border-gray-400 bg-gray-50;
}

.upload-zone.drag-over {
  @apply border-indigo-500 bg-indigo-50;
}

.upload-zone.uploading {
  @apply border-indigo-500 bg-indigo-50 cursor-not-allowed;
}

.upload-zone.has-error {
  @apply border-red-300 bg-red-50;
}

.upload-content {
  @apply flex flex-col items-center justify-center;
}

.uploading-state {
  @apply text-center;
}

.upload-prompt {
  @apply text-center;
}

.error-message {
  @apply bg-red-50 border border-red-200 rounded-lg p-4;
}

.images-grid {
  @apply space-y-4;
}

.image-item {
  @apply relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200;
}

.image-item.is-thumbnail {
  @apply ring-2 ring-yellow-400 border-yellow-400;
}

.image-preview {
  @apply relative;
}

.thumbnail-badge {
  @apply absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1;
}

.loading-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center;
}

.image-info {
  @apply p-3;
}

.image-actions {
  @apply absolute top-2 right-2 flex space-x-1;
}

.action-btn {
  @apply p-1.5 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-all duration-200 shadow-sm;
}

.thumbnail-btn {
  @apply text-gray-600 hover:text-yellow-600;
}

.thumbnail-btn.active {
  @apply text-yellow-600 bg-yellow-100;
}

.thumbnail-btn:disabled {
  @apply cursor-not-allowed opacity-50;
}

.delete-btn {
  @apply text-gray-600 hover:text-red-600;
}

.delete-btn:hover {
  @apply bg-red-50;
}
</style>

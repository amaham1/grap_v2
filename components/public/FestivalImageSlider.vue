<template>
  <div v-if="images.length > 0" class="festival-image-slider">
    <!-- 메인 이미지 표시 영역 -->
    <div class="relative bg-gray-100 rounded-lg overflow-hidden">
      <div class="aspect-video relative">
        <img
          :src="currentImage.file_url"
          :alt="currentImage.alt_text || '축제 이미지'"
          class="w-full h-full object-contain cursor-pointer transition-transform duration-200 hover:scale-105"
          @error="handleImageError"
          @click="openImageModal(currentIndex)"
        />
        
        <!-- 이미지 설명 오버레이 -->
        <div v-if="currentImage.description" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p class="text-white text-sm">{{ currentImage.description }}</p>
        </div>

        <!-- 이전/다음 버튼 (이미지가 2개 이상일 때만) -->
        <template v-if="images.length > 1">
          <button
            @click="previousImage"
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200 shadow-lg"
            :disabled="currentIndex === 0"
            :class="{ 'opacity-50 cursor-not-allowed': currentIndex === 0 }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <button
            @click="nextImage"
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200 shadow-lg"
            :disabled="currentIndex === images.length - 1"
            :class="{ 'opacity-50 cursor-not-allowed': currentIndex === images.length - 1 }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </template>

        <!-- 이미지 카운터 -->
        <div v-if="images.length > 1" class="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
      </div>
    </div>

    <!-- 썸네일 네비게이션 (이미지가 2개 이상일 때만) -->
    <div v-if="images.length > 1" class="mt-4">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="(image, index) in images"
          :key="image.id"
          @click="setCurrentImage(index)"
          class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200"
          :class="{
            'border-blue-500 ring-2 ring-blue-200': index === currentIndex,
            'border-gray-200 hover:border-gray-300': index !== currentIndex
          }"
        >
          <img
            :src="image.file_url"
            :alt="image.alt_text || `썸네일 ${index + 1}`"
            class="w-full h-full object-cover cursor-pointer"
            @error="handleImageError"
            @click="openImageModal(index)"
          />
        </button>
      </div>
    </div>

    <!-- 이미지 정보 -->
    <div class="mt-4 text-sm text-gray-600">
      <p>총 {{ images.length }}개의 이미지</p>
    </div>
  </div>

  <!-- 로딩 상태 -->
  <div v-else-if="loading" class="text-center py-8 text-gray-500">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
    <p>이미지를 불러오는 중...</p>
  </div>

  <!-- 에러 상태 -->
  <div v-else-if="error" class="text-center py-8 text-red-500">
    <svg class="w-12 h-12 mx-auto mb-3 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
    <p>{{ error }}</p>
    <button @click="loadImages" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      다시 시도
    </button>
  </div>

  <!-- 이미지가 없는 경우 -->
  <div v-else class="text-center py-8 text-gray-500">
    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
    <p>등록된 이미지가 없습니다.</p>
  </div>

  <!-- 이미지 확대 모달 -->
  <Teleport to="body">
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      @click="closeImageModal"
      @keydown.esc="closeImageModal"
    >
      <div class="relative max-w-7xl max-h-full p-4">
        <!-- 닫기 버튼 -->
        <button
          @click="closeImageModal"
          class="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-all duration-200"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <!-- 확대된 이미지 -->
        <img
          v-if="modalImage"
          :src="modalImage.file_url"
          :alt="modalImage.alt_text || '축제 이미지'"
          class="max-w-full max-h-full object-contain rounded-lg"
          @error="handleImageError"
          @click.stop
        />

        <!-- 이전/다음 버튼 (이미지가 2개 이상일 때만) -->
        <template v-if="images.length > 1">
          <button
            @click.stop="previousModalImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-all duration-200"
            :disabled="modalIndex === 0"
            :class="{ 'opacity-50 cursor-not-allowed': modalIndex === 0 }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          <button
            @click.stop="nextModalImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-all duration-200"
            :disabled="modalIndex === images.length - 1"
            :class="{ 'opacity-50 cursor-not-allowed': modalIndex === images.length - 1 }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </template>

        <!-- 이미지 정보 -->
        <div class="absolute bottom-4 left-4 right-4 text-center">
          <div class="bg-black/50 text-white px-4 py-2 rounded-lg inline-block">
            <p class="text-sm">{{ modalIndex + 1 }} / {{ images.length }}</p>
            <p v-if="modalImage?.description" class="text-xs mt-1 opacity-80">{{ modalImage.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface FestivalImage {
  id: number;
  file_url: string;
  alt_text: string;
  description: string;
  width?: number;
  height?: number;
  is_thumbnail: boolean;
  display_order: number;
}

interface Props {
  festivalId: number | string;
}

const props = defineProps<Props>();

// 축제 ID를 숫자로 변환
const numericFestivalId = computed(() => {
  return typeof props.festivalId === 'string' ? parseInt(props.festivalId) : props.festivalId;
});

// 이미지 데이터 상태
const images = ref<FestivalImage[]>([]);
const currentIndex = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);

// 모달 상태
const isModalOpen = ref(false);
const modalIndex = ref(0);

// 현재 이미지
const currentImage = computed(() => images.value[currentIndex.value]);

// 모달 이미지
const modalImage = computed(() => images.value[modalIndex.value]);

// 이미지 데이터 로드
async function loadImages() {
  try {
    loading.value = true;
    error.value = null;

    const response = await $fetch<{
      success: boolean;
      data: {
        festival_id: number;
        images: FestivalImage[];
        total_count: number;
      };
    }>(`/api/public/festivals/${numericFestivalId.value}/images`);

    if (response.success && response.data.images) {
      images.value = response.data.images;
      currentIndex.value = 0;
    } else {
      images.value = [];
    }
  } catch (err: any) {
    error.value = `이미지를 불러오는 중 오류가 발생했습니다: ${err.statusMessage || err.message}`;
    images.value = [];
  } finally {
    loading.value = false;
  }
}

// 이미지 네비게이션
function nextImage() {
  if (currentIndex.value < images.value.length - 1) {
    currentIndex.value++;
  }
}

function previousImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function setCurrentImage(index: number) {
  if (index >= 0 && index < images.value.length) {
    currentIndex.value = index;
  }
}

// 모달 관련 함수들
function openImageModal(index: number) {
  modalIndex.value = index;
  isModalOpen.value = true;
  // 스크롤 방지
  if (import.meta.client) {
    document.body.style.overflow = 'hidden';
  }
}

function closeImageModal() {
  isModalOpen.value = false;
  // 스크롤 복원
  if (import.meta.client) {
    document.body.style.overflow = '';
  }
}

function nextModalImage() {
  if (modalIndex.value < images.value.length - 1) {
    modalIndex.value++;
  }
}

function previousModalImage() {
  if (modalIndex.value > 0) {
    modalIndex.value--;
  }
}

// 이미지 로드 오류 처리
function handleImageError(e: Event) {
  if (import.meta.client) {
    try {
      const target = e.target as HTMLImageElement;
      // 1x1 투명 PNG 데이터 URL 사용
      target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      target.onerror = null;
    } catch (error) {
      console.warn('Image error handling failed:', error);
    }
  }
}

// 키보드 네비게이션
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeImageModal();
    return;
  }

  if (images.value.length <= 1) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      if (isModalOpen.value) {
        previousModalImage();
      } else {
        previousImage();
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (isModalOpen.value) {
        nextModalImage();
      } else {
        nextImage();
      }
      break;
  }
}

// 컴포넌트 마운트 시 이미지 로드
onMounted(() => {
  if (numericFestivalId.value && numericFestivalId.value > 0) {
    loadImages();
  }

  // 키보드 이벤트 리스너 등록
  if (import.meta.client) {
    document.addEventListener('keydown', handleKeydown);
  }
});

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('keydown', handleKeydown);
    // 모달이 열려있다면 스크롤 복원
    if (isModalOpen.value) {
      document.body.style.overflow = '';
    }
  }
});

// festivalId가 변경되면 이미지 다시 로드
watch(() => numericFestivalId.value, () => {
  if (numericFestivalId.value && numericFestivalId.value > 0) {
    loadImages();
  }
});
</script>

<style scoped>
.festival-image-slider {
  @apply w-full;
}

/* 썸네일 스크롤바 스타일링 */
.festival-image-slider ::-webkit-scrollbar {
  height: 4px;
}

.festival-image-slider ::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.festival-image-slider ::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

.festival-image-slider ::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}
</style>

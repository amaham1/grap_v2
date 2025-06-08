<template>
  <div class="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-md smooth-transition transform hover:-translate-y-1">
    <!-- 커버 이미지 -->
    <div v-if="item.cover_image_url" class="h-40 overflow-hidden relative">
      <img
        :src="item.cover_image_url"
        :alt="item.title"
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
      <div class="absolute top-3 right-3">
        <span class="px-3 py-1 text-xs bg-white/90 text-purple-700 rounded-full font-medium backdrop-blur-sm">
          {{ item.category_name }}
        </span>
      </div>
    </div>
    <div v-else class="h-40 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center relative">
      <div class="text-purple-400 text-sm">이미지 없음</div>
      <div class="absolute top-3 right-3">
        <span class="px-3 py-1 text-xs bg-white/90 text-purple-700 rounded-full font-medium backdrop-blur-sm">
          {{ item.category_name }}
        </span>
      </div>
    </div>

    <div class="p-5">
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
          {{ item.title }}
        </h3>
        <div class="w-2 h-2 bg-purple-500 rounded-full ml-3 mt-2 flex-shrink-0"></div>
      </div>

      <div class="space-y-1 mb-3">
        <div class="flex items-center text-xs text-gray-600">
          <svg class="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          {{ item.location_name }}
        </div>
        <div class="flex items-center text-xs text-gray-600">
          <svg class="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          {{ formatDateRange(item.start_date, item.end_date) }}
        </div>
        <div class="flex items-center text-xs text-gray-600">
          <svg class="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
          {{ item.pay_info || '요금 정보 없음' }}
        </div>
      </div>

      <div class="flex justify-between items-center">
        <span :class="statusClass">{{ getStatusText() }}</span>

        <NuxtLink
          :to="`/alljeju/exhibitions/${item.id}`"
          class="text-sm text-blue-600 hover:text-blue-700 font-medium smooth-transition flex items-center"
        >
          자세히 보기
          <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ExhibitionItem {
  id: number;
  title: string;
  category_name: string;
  cover_image_url: string;
  start_date: Date | string;
  end_date: Date | string;
  time_info: string;
  pay_info: string;
  location_name: string;
  organizer_info: string;
  tel_number: string;
  status_info: string;
  division_name: string;
  fetched_at: Date | string;
}

const props = defineProps<{
  item: ExhibitionItem;
}>();

// 이미지 로드 오류 처리
function handleImageError(e: Event) {
  // 클라이언트 사이드에서만 실행되도록 합니다.
  if (import.meta.client) {
    const target = e.target as HTMLImageElement;
    target.src = '/images/no-image.svg'; // SVG 기본 이미지로 대체
    target.onerror = null; // 재귀적 오류 방지
  }
}

// 전시 상태 (진행 중, 예정, 종료 등)
function getStatusText(): string {
  const now = new Date();
  const startDate = new Date(props.item.start_date);
  const endDate = new Date(props.item.end_date);

  if (now < startDate) {
    return '예정';
  } else if (now > endDate) {
    return '종료';
  } else {
    return '진행중';
  }
}

// 상태에 따른 CSS 클래스
const statusClass = computed(() => {
  const status = getStatusText();

  if (status === '예정') {
    return 'px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full';
  } else if (status === '종료') {
    return 'px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full';
  } else {
    return 'px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full';
  }
});

// 날짜 범위 포맷팅
function formatDateRange(start: Date | string, end: Date | string): string {
  if (!start || !end) return '-';

  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return `${startDate.toLocaleDateString('ko-KR', options)} ~ ${endDate.toLocaleDateString('ko-KR', options)}`;
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

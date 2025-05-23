<template>
  <div class="group bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden hover:shadow-soft-xl dark:shadow-gray-900 transition-all duration-300 animate-fade-in">
    <!-- 커버 이미지 -->
    <div class="relative">
      <div v-if="item.cover_image_url" class="h-52 overflow-hidden">
        <img
          :src="item.cover_image_url"
          :alt="item.title"
          class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          @error="handleImageError"
        />
      </div>
      <div v-else class="h-52 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- 카테고리 뱃지 -->
      <span class="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium bg-teal-100/90 dark:bg-teal-900/90 text-teal-800 dark:text-teal-200 rounded-full backdrop-blur-sm">
        {{ item.category_name }}
      </span>
    </div>

    <div class="p-5 dark:text-gray-200">
      <h3 class="text-lg font-bold text-gray-800 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
        {{ item.title }}
      </h3>

      <div class="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <div class="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mt-0.5 mr-2 text-primary-500 dark:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="line-clamp-1">{{ item.location_name }}</span>
        </div>

        <div class="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mt-0.5 mr-2 text-primary-500 dark:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDateRange(item.start_date, item.end_date) }}</span>
        </div>

        <div class="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mt-0.5 mr-2 text-primary-500 dark:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ item.time_info || '시간 정보 없음' }}</span>
        </div>

        <div class="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mt-0.5 mr-2 text-primary-500 dark:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="line-clamp-1">{{ item.pay_info || '요금 정보 없음' }}</span>
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div>
          <span :class="statusClass">{{ getStatusText() }}</span>
        </div>

        <NuxtLink
          :to="`/alljeju/exhibitions/${item.id}`"
          class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors duration-200"
        >
          자세히 보기
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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
  if (process.client) {
    const target = e.target as HTMLImageElement;
    target.src = '/images/no-image.png'; // 기본 이미지 경로로 대체 (해당 이미지가 있다고 가정)
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
    return 'px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full';
  } else if (status === '종료') {
    return 'px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full';
  } else {
    return 'px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full';
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

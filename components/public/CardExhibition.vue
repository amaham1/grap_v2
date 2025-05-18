<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
    <!-- 커버 이미지 -->
    <div v-if="item.cover_image_url" class="h-48 overflow-hidden">
      <img 
        :src="item.cover_image_url" 
        :alt="item.title" 
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
    </div>
    <div v-else class="h-48 bg-gray-200 flex items-center justify-center">
      <span class="text-gray-500">이미지 없음</span>
    </div>
    
    <div class="p-5">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-lg font-semibold text-gray-800 line-clamp-2">
          {{ item.title }}
        </h3>
        <span class="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full ml-2 whitespace-nowrap">
          {{ item.category_name }}
        </span>
      </div>
      
      <div class="text-sm text-gray-600 mb-3">
        <div class="mb-1">
          <span class="font-medium">장소:</span> {{ item.location_name }}
        </div>
        <div class="mb-1">
          <span class="font-medium">기간:</span> {{ formatDateRange(item.start_date, item.end_date) }}
        </div>
        <div>
          <span class="font-medium">시간:</span> {{ item.time_info || '시간 정보 없음' }}
        </div>
      </div>
      
      <div class="text-sm text-gray-600 mb-3">
        <div class="line-clamp-1">
          <span class="font-medium">요금:</span> {{ item.pay_info || '요금 정보 없음' }}
        </div>
      </div>
      
      <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div class="text-xs text-gray-500 flex items-center">
          <span :class="statusClass">{{ getStatusText() }}</span>
        </div>
        
        <NuxtLink 
          :to="`/exhibitions/${item.id}`" 
          class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          자세히 보기
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
  const target = e.target as HTMLImageElement;
  target.src = '/images/no-image.png'; // 기본 이미지 경로로 대체 (해당 이미지가 있다고 가정)
  target.onerror = null; // 재귀적 오류 방지
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
    return 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full';
  } else if (status === '종료') {
    return 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full';
  } else {
    return 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full';
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

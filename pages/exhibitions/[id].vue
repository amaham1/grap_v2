<template>
  <div>
    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <!-- 에러 메시지 -->
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
      <p class="font-medium">공연/전시 정보를 불러오는 중 오류가 발생했습니다.</p>
      <button 
        @click="refresh" 
        class="mt-2 px-4 py-2 bg-white text-red-700 rounded-md hover:bg-red-50 border border-red-300"
      >
        다시 시도
      </button>
    </div>
    
    <!-- 공연/전시 상세 -->
    <div v-else-if="exhibition" class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- 이미지 섹션 -->
      <div v-if="exhibition.cover_image_url" class="h-64 md:h-80 lg:h-96 w-full relative overflow-hidden">
        <img 
          :src="exhibition.cover_image_url" 
          :alt="exhibition.title" 
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
      </div>
      
      <!-- 헤더 -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
          <h1 class="text-2xl font-bold text-gray-800">{{ exhibition.title }}</h1>
          
          <span class="px-3 py-1 text-sm font-medium bg-teal-100 text-teal-800 rounded-full">
            {{ exhibition.category_name }}
          </span>
        </div>
        
        <!-- 상태 표시 -->
        <div class="mb-4">
          <span :class="statusClass">{{ getStatusText() }}</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span class="font-medium">기간:</span> {{ formatDateRange(exhibition.start_date, exhibition.end_date) }}
          </div>
          <div>
            <span class="font-medium">시간:</span> {{ exhibition.time_info || '시간 정보 없음' }}
          </div>
          <div>
            <span class="font-medium">요금:</span> {{ exhibition.pay_info || '요금 정보 없음' }}
          </div>
          <div>
            <span class="font-medium">장소:</span> {{ exhibition.location_name || '장소 정보 없음' }}
          </div>
          <div>
            <span class="font-medium">주최:</span> {{ exhibition.organizer_info || '주최 정보 없음' }}
          </div>
          <div>
            <span class="font-medium">문의전화:</span> {{ exhibition.tel_number || '전화번호 정보 없음' }}
          </div>
        </div>
      </div>
      
      <!-- 추가 정보 -->
      <div class="p-6">
        <div v-if="exhibition.status_info" class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">상태 정보</h2>
          <p class="text-gray-700">{{ exhibition.status_info }}</p>
        </div>
        
        <div v-if="exhibition.division_name" class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">구분</h2>
          <p class="text-gray-700">{{ exhibition.division_name }}</p>
        </div>
        
        <div class="text-sm text-gray-500 mt-6">
          정보 업데이트: {{ formatDate(exhibition.fetched_at) }}
        </div>
      </div>
      
      <!-- 하단 네비게이션 -->
      <div class="p-6 bg-gray-50 border-t border-gray-200">
        <div class="flex justify-between">
          <NuxtLink 
            to="/exhibitions" 
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            목록으로 돌아가기
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

const route = useRoute();
const id = route.params.id;

// 데이터 가져오기
const { data, pending: loading, error, refresh } = await useFetch(`/api/public/exhibitions/${id}`);

// 공연/전시 정보
const exhibition = computed(() => data.value?.item);

// 이미지 로드 오류 처리
function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.src = '/images/no-image.png'; // 기본 이미지 경로로 대체 (해당 이미지가 있다고 가정)
  target.onerror = null; // 재귀적 오류 방지
}

// 공연/전시 상태 (진행 중, 예정, 종료 등)
function getStatusText(): string {
  if (!exhibition.value) return '';
  
  const now = new Date();
  const startDate = new Date(exhibition.value.start_date);
  const endDate = new Date(exhibition.value.end_date);
  
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
    return 'px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full';
  } else if (status === '종료') {
    return 'px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full';
  } else {
    return 'px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full';
  }
});

// 날짜 포맷팅
function formatDate(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

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

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- 에러 메시지 -->
    <div v-else-if="error" class="toss-card p-6 border-red-200 bg-red-50 mb-6">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="flex-1">
          <p class="text-red-700 font-medium mb-3">공연/전시 정보를 불러오는 중 오류가 발생했습니다.</p>
          <button
            @click="refresh"
            class="px-4 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 border border-red-300 text-sm font-medium smooth-transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>

    <!-- 공연/전시 상세 -->
    <div v-else-if="exhibition">
      <!-- 뒤로 가기 버튼 -->
      <div class="mb-6">
        <NuxtLink
          to="/alljeju/exhibitions"
          class="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 smooth-transition"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          공연/전시 목록으로
        </NuxtLink>
      </div>

      <!-- 메인 콘텐츠 -->
      <div class="toss-card overflow-hidden">
        <!-- 이미지 섹션 -->
        <div v-if="exhibition.cover_image_url" class="h-64 md:h-80 lg:h-96 w-full relative overflow-hidden">
          <img
            :src="exhibition.cover_image_url"
            :alt="exhibition.title"
            class="w-full h-full object-cover smooth-transition hover:scale-105"
            @error="handleImageError"
          />
        </div>

        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-100">
          <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
            <h1 class="text-2xl font-bold text-gray-900 leading-tight">{{ exhibition.title }}</h1>

            <span class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
              {{ exhibition.category_name }}
            </span>
          </div>

          <!-- 상태 표시 -->
          <div class="mb-4">
            <span :class="statusClass">{{ getStatusText() }}</span>
          </div>
        </div>

        <!-- 상세 정보 -->
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="space-y-4">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <div>
                  <div class="text-sm font-medium text-gray-900">기간</div>
                  <div class="text-sm text-gray-600">{{ formatDateRange(exhibition.start_date, exhibition.end_date) }}</div>
                </div>
              </div>

              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <div class="text-sm font-medium text-gray-900">시간</div>
                  <div class="text-sm text-gray-600">{{ exhibition.time_info || '시간 정보 없음' }}</div>
                </div>
              </div>

              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
                <div>
                  <div class="text-sm font-medium text-gray-900">요금</div>
                  <div class="text-sm text-gray-600">{{ exhibition.pay_info || '요금 정보 없음' }}</div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div>
                  <div class="text-sm font-medium text-gray-900">장소</div>
                  <div class="text-sm text-gray-600">{{ exhibition.location_name || '장소 정보 없음' }}</div>
                </div>
              </div>

              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <div>
                  <div class="text-sm font-medium text-gray-900">주최</div>
                  <div class="text-sm text-gray-600">{{ exhibition.organizer_info || '주최 정보 없음' }}</div>
                </div>
              </div>

              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <div>
                  <div class="text-sm font-medium text-gray-900">문의전화</div>
                  <div class="text-sm text-gray-600">{{ exhibition.tel_number || '전화번호 정보 없음' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 추가 정보 -->
          <div v-if="exhibition.status_info || exhibition.division_name" class="space-y-6">
            <div v-if="exhibition.status_info" class="p-4 bg-gray-50 rounded-xl">
              <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <div class="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
                상태 정보
              </h3>
              <p class="text-gray-700">{{ exhibition.status_info }}</p>
            </div>

            <div v-if="exhibition.division_name" class="p-4 bg-gray-50 rounded-xl">
              <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <div class="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
                구분
              </h3>
              <p class="text-gray-700">{{ exhibition.division_name }}</p>
            </div>
          </div>

          <div class="mt-8 flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            업데이트: {{ formatDate(exhibition.fetched_at) }}
          </div>
        </div>
      </div>

      <!-- 하단 액션 -->
      <div class="mt-8 flex justify-center">
        <NuxtLink
          to="/alljeju/exhibitions"
          class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium smooth-transition flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
          목록으로 돌아가기
        </NuxtLink>
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
    return 'px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full';
  } else if (status === '종료') {
    return 'px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full';
  } else {
    return 'px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full';
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

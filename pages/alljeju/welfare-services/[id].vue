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
          <p class="text-red-700 font-medium mb-3">복지 서비스 정보를 불러오는 중 오류가 발생했습니다.</p>
          <button
            @click="refresh"
            class="px-4 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 border border-red-300 text-sm font-medium smooth-transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>

    <!-- 서비스 상세 -->
    <div v-else-if="service">
      <!-- 뒤로 가기 버튼 -->
      <div class="mb-6">
        <button
          @click="goBack"
          class="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 smooth-transition"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          {{ backButtonText }}
        </button>
      </div>

      <!-- 메인 콘텐츠 -->
      <div class="toss-card overflow-hidden">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-100">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <h1 class="text-2xl font-bold text-gray-900 leading-tight">{{ service.service_name }}</h1>

            <div class="flex flex-wrap gap-2">
              <span
                v-if="service.is_all_location"
                class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
              >
                전체 지역
              </span>
              <span
                v-if="service.is_jeju_location"
                class="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full"
              >
                제주시
              </span>
              <span
                v-if="service.is_seogwipo_location"
                class="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full"
              >
                서귀포시
              </span>
            </div>
          </div>

          <div class="mt-4 flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            업데이트: {{ formatDate(service.fetched_at) }}
          </div>
        </div>

        <!-- 콘텐츠 -->
        <div class="p-6 space-y-8">
          <!-- 지원 대상 정보 -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div class="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
              지원 대상
            </h2>
            <div class="prose prose-blue max-w-none" v-html="service.support_target_html"></div>
          </div>

          <!-- 지원 내용 정보 -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div class="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
              지원 내용
            </h2>
            <div class="prose prose-blue max-w-none" v-html="service.support_content_html"></div>
          </div>

          <!-- 신청 방법 정보 -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div class="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
              신청 방법
            </h2>
            <div class="prose prose-blue max-w-none" v-html="service.application_info_html"></div>
          </div>
        </div>
      </div>

      <!-- 하단 액션 -->
      <div class="mt-8 flex justify-center">
        <button
          @click="goBack"
          class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium smooth-transition flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
          {{ backButtonText }}
        </button>
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
const { data, pending: loading, error, refresh } = await useFetch(`/api/public/welfare-services/${id}`);

// 서비스 정보
const service = computed(() => data.value?.item);

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

// 뒤로가기 버튼 텍스트
const backButtonText = computed(() => {
  if (process.client) {
    const referrer = document.referrer;
    if (referrer.includes('/alljeju/welfare-services') && !referrer.includes('/alljeju/welfare-services/')) {
      return '복지 서비스 목록으로';
    } else if (referrer.includes('/alljeju') && !referrer.includes('/alljeju/welfare-services')) {
      return '이전 페이지로';
    }
  }
  return '복지 서비스 목록으로';
});

// 뒤로가기 기능
function goBack() {
  if (process.client) {
    const referrer = document.referrer;

    // 메인 페이지에서 직접 접속한 경우
    if (referrer.includes('/alljeju') && !referrer.includes('/alljeju/welfare-services')) {
      navigateTo('/alljeju');
      return;
    }

    // 복지 서비스 목록에서 접속한 경우 - 세션 스토리지에서 상태 복원
    if (referrer.includes('/alljeju/welfare-services') && !referrer.includes('/alljeju/welfare-services/')) {
      // 세션 스토리지에 복원 플래그 설정
      sessionStorage.setItem('should-restore-welfare-state', 'true');
      navigateTo('/alljeju/welfare-services');
      return;
    }

    // 기본적으로 복지 서비스 목록으로
    navigateTo('/alljeju/welfare-services');
  } else {
    navigateTo('/alljeju/welfare-services');
  }
}
</script>

<style>
/* 토스 스타일 prose 커스텀 스타일 */
.prose {
  color: #374151;
  line-height: 1.7;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  color: #1f2937;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}

.prose h1 { font-size: 1.5rem; }
.prose h2 { font-size: 1.25rem; }
.prose h3 { font-size: 1.125rem; }

.prose p {
  margin-bottom: 1em;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.prose table th,
.prose table td {
  border: 1px solid #e5e7eb;
  padding: 0.75rem;
  text-align: left;
}

.prose table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.prose table tbody tr:nth-child(even) {
  background-color: #f9fafb;
}

.prose a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.prose a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.prose ul, .prose ol {
  padding-left: 1.5em;
  margin: 1em 0;
}

.prose li {
  margin: 0.5em 0;
}

.prose img {
  margin: 1.5em auto;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.prose blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1.5em 0;
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  font-style: italic;
}

.prose code {
  background-color: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #1e40af;
}

.prose pre {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.75rem;
  overflow-x: auto;
  margin: 1.5em 0;
}

.prose strong {
  font-weight: 600;
  color: #1f2937;
}
</style>

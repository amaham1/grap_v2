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
          <p class="text-red-700 font-medium mb-3">행사/축제 정보를 불러오는 중 오류가 발생했습니다.</p>
          <button
            @click="() => refresh()"
            class="px-4 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 border border-red-300 text-sm font-medium smooth-transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>

    <!-- 행사/축제 상세 -->
    <div v-else-if="festival">
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
          <h1 class="text-2xl font-bold text-gray-900 mb-4 leading-tight">{{ festival.title }}</h1>

          <div class="flex flex-wrap gap-2 mb-4">
            <span class="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full">
              축제/행사
            </span>
            <span class="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {{ festival.writer_name || '작성자 정보 없음' }}
            </span>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-gray-500">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              작성일: {{ formatDate(festival.written_date) }}
            </div>
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              업데이트: {{ formatDate(festival.fetched_at) }}
            </div>
          </div>
        </div>

        <!-- 이미지 슬라이더 -->
        <div v-if="festival" class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">축제 이미지</h2>
          <ClientOnly>
            <FestivalImageSlider :festival-id="Number(festival.id)" />
            <template #fallback>
              <div class="text-center py-8 text-gray-500">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p>이미지를 불러오는 중...</p>
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- festival이 없을 때 표시 -->
        <div v-else class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">축제 이미지</h2>
          <p class="text-gray-500">축제 정보를 불러오는 중...</p>
        </div>

        <!-- 콘텐츠 -->
        <div class="p-6">
          <!-- 본문 내용 -->
          <div class="mb-8">
            <PublicContentDisplay
              :content="festival.content"
              :content-html="festival.content_html"
            />
          </div>

          <!-- 첨부 파일 목록 -->
          <div v-if="hasFiles" class="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              첨부 파일
            </h3>
            <ul class="space-y-3">
              <li v-for="(file, index) in files" :key="index" class="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 smooth-transition">
                <svg class="w-4 h-4 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <a
                  :href="file.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-700 font-medium smooth-transition"
                >
                  {{ file.name || `첨부파일 ${index + 1}` }}
                </a>
              </li>
            </ul>
          </div>

          <!-- 원본 소스 링크 -->
          <div v-if="festival.source_url" class="mt-8 p-4 bg-blue-50 rounded-xl">
            <a
              :href="festival.source_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium smooth-transition"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              원본 페이지에서 더 자세히 보기
            </a>
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

// 컴포넌트 직접 임포트
import FestivalImageSlider from '~/components/public/FestivalImageSlider.vue';

const route = useRoute();
const id = route.params.id;

// 타입 정의
interface FestivalDetail {
  id: number;
  title: string;
  content_html: string;
  content?: string; // 원본 텍스트 내용 추가
  source_url: string;
  writer_name: string;
  written_date: string;
  files_info?: any;
  fetched_at: string;
}

// 데이터 가져오기
const { data, pending: loading, error, refresh } = await useFetch<{item: FestivalDetail}>(`/api/public/festivals/${id}`);

// 행사/축제 정보
const festival = computed(() => data.value?.item);

// 첨부 파일 정보 파싱
const files = computed(() => {
  if (!festival.value || !festival.value.files_info) return [];

  let filesInfo = festival.value.files_info;
  if (typeof filesInfo === 'string') {
    try {
      filesInfo = JSON.parse(filesInfo);
    } catch (e) {
      return [];
    }
  }

  return Array.isArray(filesInfo) ? filesInfo : [];
});

const hasFiles = computed(() => files.value.length > 0);

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
  return '행사/축제 목록으로';
});

// 페이지 상태 관리 composable 사용
const pageStateManager = usePageState({
  key: 'festivals',
  defaultState: {
    page: 1,
    search: '',
    sortBy: 'written_date',
    sortOrder: 'desc'
  }
});

// 뒤로가기 기능
function goBack() {
  // 항상 행사/축제 목록으로 이동
  // 복원 플래그 설정
  pageStateManager.prepareForReturn();
  navigateTo('/alljeju/festivals');
}
</script>

<style>
/* 기본 스타일만 유지 */
</style>

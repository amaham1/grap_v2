<template>
  <div>
    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <!-- 에러 메시지 -->
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
      <p class="font-medium">행사/축제 정보를 불러오는 중 오류가 발생했습니다.</p>
      <button 
        @click="refresh" 
        class="mt-2 px-4 py-2 bg-white text-red-700 rounded-md hover:bg-red-50 border border-red-300"
      >
        다시 시도
      </button>
    </div>
    
    <!-- 행사/축제 상세 -->
    <div v-else-if="festival" class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- 헤더 -->
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ festival.title }}</h1>
        
        <div class="flex flex-wrap gap-2 mb-3">
          <span class="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
            축제/행사
          </span>
          <span class="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            {{ festival.writer_name || '작성자 정보 없음' }}
          </span>
        </div>
        
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            작성일: {{ formatDate(festival.written_date) }}
          </div>
          <div>
            정보 업데이트: {{ formatDate(festival.fetched_at) }}
          </div>
        </div>
      </div>
      
      <!-- 콘텐츠 -->
      <div class="p-6">
        <!-- 본문 내용 -->
        <div class="prose prose-indigo max-w-none mb-8" v-html="festival.content_html"></div>
        
        <!-- 첨부 파일 목록 -->
        <div v-if="hasFiles" class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">첨부 파일</h3>
          <ul class="space-y-2">
            <li v-for="(file, index) in files" :key="index" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <a 
                :href="file.url" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {{ file.name || `첨부파일 ${index + 1}` }}
              </a>
            </li>
          </ul>
        </div>
        
        <!-- 원본 소스 링크 -->
        <div v-if="festival.source_url" class="mt-6">
          <a 
            :href="festival.source_url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            원본 페이지로 이동
          </a>
        </div>
      </div>
      
      <!-- 하단 네비게이션 -->
      <div class="p-6 bg-gray-50 border-t border-gray-200">
        <div class="flex justify-between">
          <NuxtLink 
            to="/festivals" 
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
const { data, pending: loading, error, refresh } = await useFetch(`/api/public/festivals/${id}`);

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
</script>

<style>
/* Tailwind Typography를 사용하는 prose 클래스에 대한 추가 스타일 */
.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  color: #1e3a8a;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.prose table th,
.prose table td {
  border: 1px solid #e5e7eb;
  padding: 0.5em;
}

.prose table th {
  background-color: #f3f4f6;
}

.prose a {
  color: #4f46e5;
  text-decoration: underline;
}

.prose a:hover {
  color: #4338ca;
}

.prose ul, .prose ol {
  padding-left: 1.5em;
}

.prose img {
  margin: 1em auto;
  border-radius: 0.375rem;
}
</style>

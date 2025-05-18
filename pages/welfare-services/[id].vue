<template>
  <div>
    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <!-- 에러 메시지 -->
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
      <p class="font-medium">복지 서비스 정보를 불러오는 중 오류가 발생했습니다.</p>
      <button 
        @click="refresh" 
        class="mt-2 px-4 py-2 bg-white text-red-700 rounded-md hover:bg-red-50 border border-red-300"
      >
        다시 시도
      </button>
    </div>
    
    <!-- 서비스 상세 -->
    <div v-else-if="service" class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- 헤더 -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-start">
          <h1 class="text-2xl font-bold text-gray-800">{{ service.service_name }}</h1>
          
          <div class="flex space-x-2">
            <span 
              v-if="service.is_all_location" 
              class="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full"
            >
              전체 지역
            </span>
            <span 
              v-if="service.is_jeju_location" 
              class="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full"
            >
              제주시
            </span>
            <span 
              v-if="service.is_seogwipo_location" 
              class="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
            >
              서귀포시
            </span>
          </div>
        </div>
        
        <div class="mt-4 text-sm text-gray-500">
          정보 업데이트: {{ formatDate(service.fetched_at) }}
        </div>
      </div>
      
      <!-- 콘텐츠 -->
      <div class="p-6">
        <!-- 지원 대상 정보 -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">지원 대상</h2>
          <div class="prose prose-indigo max-w-none" v-html="service.support_target_html"></div>
        </div>
        
        <!-- 지원 내용 정보 -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">지원 내용</h2>
          <div class="prose prose-indigo max-w-none" v-html="service.support_content_html"></div>
        </div>
        
        <!-- 신청 방법 정보 -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">신청 방법</h2>
          <div class="prose prose-indigo max-w-none" v-html="service.application_info_html"></div>
        </div>
      </div>
      
      <!-- 하단 네비게이션 -->
      <div class="p-6 bg-gray-50 border-t border-gray-200">
        <div class="flex justify-between">
          <NuxtLink 
            to="/welfare-services" 
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

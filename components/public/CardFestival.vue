<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
    <div class="p-5">
      <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {{ item.title }}
      </h3>
      
      <div class="flex flex-wrap gap-2 mb-3">
        <span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
          축제/행사
        </span>
        <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          {{ item.writer_name || '작성자 정보 없음' }}
        </span>
      </div>
      
      <p class="text-sm text-gray-600 line-clamp-3" v-html="getSummary(item.content_html)"></p>
      
      <!-- 첨부 파일이 있는 경우 -->
      <div v-if="hasFiles" class="mt-3 flex items-center text-xs text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <span>첨부 파일: {{ filesCount }}개</span>
      </div>
      
      <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div class="text-xs text-gray-500">
          작성일: {{ formatDate(item.written_date) }}
        </div>
        
        <NuxtLink 
          :to="`/festivals/${item.id}`" 
          class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          자세히 보기
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FestivalItem {
  id: number;
  title: string;
  content_html: string;
  source_url: string;
  writer_name: string;
  written_date: Date | string;
  files_info: any;
  fetched_at: Date | string;
}

const props = defineProps<{
  item: FestivalItem;
}>();

// 첨부 파일 여부 및 개수 계산
const hasFiles = computed(() => {
  if (!props.item.files_info) return false;
  
  let files = props.item.files_info;
  if (typeof files === 'string') {
    try {
      files = JSON.parse(files);
    } catch (e) {
      return false;
    }
  }
  
  return Array.isArray(files) && files.length > 0;
});

const filesCount = computed(() => {
  if (!hasFiles.value) return 0;
  
  let files = props.item.files_info;
  if (typeof files === 'string') {
    try {
      files = JSON.parse(files);
    } catch (e) {
      return 0;
    }
  }
  
  return Array.isArray(files) ? files.length : 0;
});

// HTML에서 텍스트만 추출하여 요약 생성
function getSummary(html: string): string {
  if (!html) return '';
  
  // HTML 태그 제거 및 텍스트 추출
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // 앞 부분 120자 정도만 반환
  return textContent.trim().substring(0, 120) + (textContent.length > 120 ? '...' : '');
}

// 날짜 포맷팅
function formatDate(date: Date | string): string {
  if (!date) return '-';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>

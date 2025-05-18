<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
    <div class="p-5">
      <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {{ item.service_name }}
      </h3>
      
      <div class="flex flex-wrap gap-2 mb-3">
        <span 
          v-if="item.is_all_location" 
          class="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
        >
          전체 지역
        </span>
        <span 
          v-if="item.is_jeju_location" 
          class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
        >
          제주시
        </span>
        <span 
          v-if="item.is_seogwipo_location" 
          class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
        >
          서귀포시
        </span>
      </div>
      
      <p class="text-sm text-gray-600 line-clamp-3" v-html="getSummary(item.support_content_html)"></p>
      
      <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div class="text-xs text-gray-500">
          업데이트: {{ formatDate(item.fetched_at) }}
        </div>
        
        <NuxtLink 
          :to="`/alljeju/welfare-services/${item.id}`" 
          class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          자세히 보기
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface WelfareServiceItem {
  id: number;
  service_name: string;
  is_all_location: boolean;
  is_jeju_location: boolean;
  is_seogwipo_location: boolean;
  support_target_html: string;
  support_content_html: string;
  application_info_html: string;
  fetched_at: Date | string;
}

const props = defineProps<{
  item: WelfareServiceItem;
}>();

// HTML에서 텍스트만 추출하여 요약 생성
function getSummary(html: string): string {
  if (!html) return '';
  
  // HTML 태그 제거 (정규식 사용 - SSR 안전함)
  const textContent = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  
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

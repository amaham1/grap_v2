<template>
  <div class="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md smooth-transition transform hover:-translate-y-1">
    <!-- 콘텐츠 섹션 -->
    <div>
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
          {{ item.service_name }}
        </h3>
        <div class="w-2 h-2 bg-blue-500 rounded-full ml-3 mt-2 flex-shrink-0"></div>
      </div>

      <!-- 지역 정보 -->
      <div class="flex flex-wrap gap-2 mb-4">
        <span v-if="item.is_all_location" class="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">
          전체
        </span>
        <span v-if="item.is_jeju_location" class="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">
          제주시
        </span>
        <span v-if="item.is_seogwipo_location" class="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">
          서귀포시
        </span>
      </div>

      <p class="text-sm text-gray-600 line-clamp-2 mb-5 leading-relaxed" v-html="getSummary(item.support_content_html)"></p>

      <div class="flex justify-between items-center pt-3 border-t border-gray-100">
        <div class="text-xs text-gray-500">
          {{ formatDate(item.fetched_at) }}
        </div>

        <NuxtLink
          :to="`/alljeju/welfare-services/${item.id}`"
          class="text-xs text-blue-600 hover:text-blue-800 font-medium smooth-transition"
        >
          자세히 보기 →
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

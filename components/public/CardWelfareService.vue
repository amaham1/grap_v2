<template>
  <div class="toss-card p-6 smooth-transition hover:scale-[1.02]">
    <h3 class="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
      {{ item.service_name }}
    </h3>

    <div class="flex flex-wrap gap-2 mb-4">
      <span
        v-if="item.is_all_location"
        class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
      >
        전체 지역
      </span>
      <span
        v-if="item.is_jeju_location"
        class="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full"
      >
        제주시
      </span>
      <span
        v-if="item.is_seogwipo_location"
        class="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full"
      >
        서귀포시
      </span>
    </div>

    <p class="text-gray-600 line-clamp-3 mb-6 leading-relaxed" v-html="getSummary(item.support_content_html)"></p>

    <div class="flex justify-between items-center">
      <div class="text-sm text-gray-500">
        {{ formatDate(item.fetched_at) }}
      </div>

      <NuxtLink
        :to="`/alljeju/welfare-services/${item.id}`"
        class="text-blue-600 hover:text-blue-700 font-medium smooth-transition flex items-center"
      >
        자세히 보기
        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </NuxtLink>
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

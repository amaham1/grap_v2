<template>
  <div class="toss-card p-4 smooth-transition hover:scale-[1.01]">
    <h3 class="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
      {{ item.title }}
    </h3>

    <div class="flex flex-wrap gap-1 mb-3">
      <span class="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-md">
        축제/행사
      </span>
      <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
        {{ item.writer_name || '작성자 정보 없음' }}
      </span>
    </div>

    <p class="text-sm text-gray-600 line-clamp-2 mb-3" v-html="getSummary(item.content_html)"></p>

    <!-- 첨부 파일이 있는 경우 -->
    <div v-if="hasFiles" class="mb-3 flex items-center text-xs text-gray-500">
      <svg class="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <span>첨부 파일 {{ filesCount }}개</span>
    </div>

    <div class="flex justify-between items-center">
      <div class="text-xs text-gray-500">
        {{ formatDate(item.written_date) }}
      </div>

      <NuxtLink
        :to="`/alljeju/festivals/${item.id}`"
        class="text-sm text-blue-600 hover:text-blue-700 font-medium smooth-transition flex items-center"
      >
        자세히 보기
        <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </NuxtLink>
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

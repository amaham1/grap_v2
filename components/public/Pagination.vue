<template>
  <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-2 py-6">
    <!-- 처음 페이지 버튼 -->
    <button
      v-if="showFirstLastButtons && currentPage > 1"
      @click="changePage(1)"
      class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
      aria-label="처음 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    </button>

    <!-- 이전 페이지 버튼 -->
    <button
      v-if="currentPage > 1"
      @click="changePage(currentPage - 1)"
      class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
      aria-label="이전 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- 페이지 번호 버튼 -->
    <div class="flex flex-wrap gap-1.5">
      <template v-for="page in displayedPages" :key="page">
        <button
          v-if="page !== '...'"
          @click="changePage(page)"
          :class="[
            'min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50',
            currentPage === page
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
              : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'
          ]"
        >
          {{ page }}
        </button>
        <span
          v-else
          class="flex items-center justify-center min-w-[40px] h-10 px-3 text-sm text-gray-500 dark:text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </span>
      </template>
    </div>

    <!-- 다음 페이지 버튼 -->
    <button
      v-if="currentPage < totalPages"
      @click="changePage(currentPage + 1)"
      class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
      aria-label="다음 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- 마지막 페이지 버튼 -->
    <button
      v-if="showFirstLastButtons && currentPage < totalPages"
      @click="changePage(totalPages)"
      class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50"
      aria-label="마지막 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  },
  showFirstLastButtons: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['page-change']);

// 표시할 페이지 번호 배열 계산
const displayedPages = computed(() => {
  if (props.totalPages <= props.maxVisiblePages) {
    // 총 페이지 수가 최대 표시 페이지 수보다 작거나 같으면 모든 페이지 표시
    return Array.from({ length: props.totalPages }, (_, i) => i + 1);
  }

  // 페이지 범위 계산
  const halfMaxVisible = Math.floor(props.maxVisiblePages / 2);
  let startPage = Math.max(props.currentPage - halfMaxVisible, 1);
  let endPage = Math.min(startPage + props.maxVisiblePages - 1, props.totalPages);

  // 마지막 페이지가 총 페이지 수보다 작으면 시작 페이지 조정
  if (endPage === props.totalPages) {
    startPage = Math.max(endPage - props.maxVisiblePages + 1, 1);
  }

  // 페이지 배열 생성
  const pages = [];

  // 첫 페이지 및 생략 부호 추가
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push('...');
    }
  }

  // 중간 페이지 추가
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // 마지막 페이지 및 생략 부호 추가
  if (endPage < props.totalPages) {
    if (endPage < props.totalPages - 1) {
      pages.push('...');
    }
    pages.push(props.totalPages);
  }

  return pages;
});

// 페이지 변경 함수
function changePage(page: number) {
  if (page !== props.currentPage && page >= 1 && page <= props.totalPages) {
    emit('page-change', page);
  }
}
</script>

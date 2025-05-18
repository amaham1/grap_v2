<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center space-x-1 py-4">
    <!-- 처음 페이지 버튼 -->
    <button
      v-if="showFirstLastButtons && currentPage > 1"
      @click="changePage(1)"
      class="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      aria-label="처음 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        <path fill-rule="evenodd" d="M7.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L3.414 10l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
    </button>
    
    <!-- 이전 페이지 버튼 -->
    <button
      v-if="currentPage > 1"
      @click="changePage(currentPage - 1)"
      class="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      aria-label="이전 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    </button>
    
    <!-- 페이지 번호 버튼 -->
    <template v-for="page in displayedPages" :key="page">
      <button
        v-if="page !== '...'"
        @click="changePage(page)"
        :class="[
          'px-3 py-1 rounded-md text-sm font-medium',
          currentPage === page
            ? 'bg-indigo-600 text-white border border-indigo-600'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        ]"
      >
        {{ page }}
      </button>
      <span
        v-else
        class="px-3 py-1 text-sm text-gray-700"
      >
        ...
      </span>
    </template>
    
    <!-- 다음 페이지 버튼 -->
    <button
      v-if="currentPage < totalPages"
      @click="changePage(currentPage + 1)"
      class="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      aria-label="다음 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
      </svg>
    </button>
    
    <!-- 마지막 페이지 버튼 -->
    <button
      v-if="showFirstLastButtons && currentPage < totalPages"
      @click="changePage(totalPages)"
      class="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      aria-label="마지막 페이지"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414z" clip-rule="evenodd" />
        <path fill-rule="evenodd" d="M12.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L16.586 10l-4.293 4.293a1 1 0 000 1.414z" clip-rule="evenodd" />
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

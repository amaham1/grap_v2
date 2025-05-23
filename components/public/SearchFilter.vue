<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft dark:shadow-gray-900 mb-8 border border-gray-100 dark:border-gray-700 animate-slide-up">
    <form @submit.prevent="emitSearch" class="space-y-5">
      <!-- 검색어 필드 -->
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">검색어</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="search"
            v-model="searchInput"
            type="text"
            class="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            :placeholder="placeholder || '검색어를 입력하세요'"
          />
        </div>
      </div>

      <!-- 필터 슬롯 - 컴포넌트 사용처에서 커스텀 필터 추가 가능 -->
      <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <slot name="filters"></slot>
      </div>

      <!-- 검색 버튼 -->
      <div class="flex flex-wrap gap-3">
        <button
          type="submit"
          class="px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-sm hover:shadow flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          검색
        </button>

        <button
          type="button"
          @click="resetSearch"
          class="px-5 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-sm hover:shadow flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          초기화
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  placeholder: {
    type: String,
    default: ''
  },
  initialSearch: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['search', 'reset']);

const searchInput = ref(props.initialSearch);

// 검색 이벤트 발생
function emitSearch() {
  emit('search', searchInput.value);
}

// 검색 초기화
function resetSearch() {
  searchInput.value = '';
  emit('reset');
}
</script>

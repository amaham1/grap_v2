<template>
  <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
    <form @submit.prevent="emitSearch" class="space-y-4">
      <!-- 검색어 필드 -->
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">검색어</label>
        <input 
          id="search" 
          v-model="searchInput"
          type="text" 
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="placeholder || '검색어를 입력하세요'"
        />
      </div>
      
      <!-- 필터 슬롯 - 컴포넌트 사용처에서 커스텀 필터 추가 가능 -->
      <slot name="filters"></slot>
      
      <!-- 검색 버튼 -->
      <div class="flex space-x-4">
        <button 
          type="submit" 
          class="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          검색
        </button>
        
        <button 
          type="button"
          @click="resetSearch"
          class="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
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

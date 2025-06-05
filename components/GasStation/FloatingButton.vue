<template>
  <div class="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30">
    <button
      @click="handleSearch"
      :disabled="isSearching"
      class="bg-white hover:bg-gray-50 disabled:bg-gray-200 text-black border border-gray-300 px-6 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      {{ isSearching ? '검색 중...' : '현 위치에서 검색' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isSearching: boolean;
}

interface Emits {
  (e: 'search'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleSearch = () => {
  emit('search');
};
</script>

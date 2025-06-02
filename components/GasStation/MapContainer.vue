<template>
  <div id="map" class="w-full h-[calc(100vh-109px)] relative">
    <!-- 로딩 상태 -->
    <div v-if="!isMapLoaded && !mapError" class="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">지도를 불러오는 중...</p>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <p class="text-gray-600 mb-2">지도를 불러올 수 없습니다.</p>
        <p class="text-sm text-gray-500">카카오맵 API 키를 확인해주세요.</p>
      </div>
    </div>

    <!-- 현 위치에서 검색 버튼 -->
    <GasStationFloatingButton
      v-if="isMapLoaded"
      :is-searching="isSearching"
      @search="handleCurrentViewSearch" />
  </div>
</template>

<script setup lang="ts">
import GasStationFloatingButton from '~/components/GasStation/FloatingButton.vue';

interface Props {
  isMapLoaded: boolean;
  mapError: boolean;
  isSearching: boolean;
}

interface Emits {
  (e: 'currentViewSearch'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleCurrentViewSearch = () => {
  emit('currentViewSearch');
};
</script>

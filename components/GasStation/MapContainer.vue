<template>
  <div class="map-container-wrapper relative">
    <!-- 지도 컨테이너 -->
    <div
      id="map"
      ref="mapContainer"
      class="w-full h-[calc(100vh-109px)] relative"
      :style="{ minHeight: '400px' }">

      <!-- 로딩 상태 -->
      <div v-if="!isMapLoaded && !mapError" class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>

      <!-- 에러 상태 -->
      <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
        <div class="text-center">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <p class="text-gray-600 mb-2">지도를 불러올 수 없습니다.</p>
          <p class="text-sm text-gray-500">카카오맵 API 키를 확인해주세요.</p>
          <button
            @click="handleRetry"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            다시 시도
          </button>
        </div>
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
  (e: 'retry'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const mapContainer = ref<HTMLElement>();

const handleCurrentViewSearch = () => {
  emit('currentViewSearch');
};

const handleRetry = () => {
  console.log('🔄 [MAP-CONTAINER] 지도 재시도 요청');
  emit('retry');
};

// 컨테이너가 마운트되었을 때 크기 확인
onMounted(() => {
  if (mapContainer.value) {
    console.log('📏 [MAP-CONTAINER] 컨테이너 크기:', {
      width: mapContainer.value.offsetWidth,
      height: mapContainer.value.offsetHeight,
      id: mapContainer.value.id
    });
  }
});
</script>

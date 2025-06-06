<template>
  <div v-if="topStations.length > 0" class="top-list-container">
    <!-- 패널 헤더 (항상 표시) -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200">
      <h3 class="text-sm font-semibold text-gray-700 flex items-center">
        🏆 최저가 TOP{{ Math.min(topStations.length, 10) }}
        <span v-if="selectedFuel" class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {{ fuelTypes.find(f => f.value === selectedFuel)?.label }}
        </span>
      </h3>
      <button
        @click="isCollapsed = !isCollapsed"
        class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
        <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': !isCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>

    <!-- 패널 내용 (접을 수 있음) -->
    <div v-show="!isCollapsed" class="p-3 max-h-80 md:max-h-96 overflow-y-auto">
      <div class="space-y-2">
        <div
          v-for="(station, index) in topStations.slice(0, 10)"
          :key="station.opinet_id"
          @click="handleStationClick(station)"
          class="p-2 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-blue-600">{{ index + 1 }}위</span>
                <h4 class="text-sm font-medium text-gray-900 truncate">{{ station.name }}</h4>
              </div>
              <p class="text-xs text-gray-600 truncate">{{ station.brand?.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ station.address }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-sm font-bold text-green-600">
                  {{ formatPrice(getStationPrice(station, selectedFuel)) }}원/L
                </span>
                <span v-if="station.distance" class="text-xs text-gray-500">
                  📍 {{ station.distance.toFixed(1) }}km
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GasStation } from '~/types/gasStation';
import { fuelTypes, formatPrice, getStationPrice } from '~/utils/gasStationUtils';

interface Props {
  topStations: GasStation[];
  selectedFuel: string;
}

interface Emits {
  (e: 'stationClick', station: GasStation): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isCollapsed = ref(true);

const handleStationClick = (station: GasStation) => {
  emit('stationClick', station);
};

// 컴포넌트 마운트 확인
onMounted(() => {
  // TopList 컴포넌트 마운트됨
});

// topStations 변경 감지
watch(() => props.topStations, (newStations) => {
  // topStations 변경됨
});
</script>

<style scoped>
.top-list-container {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 40;
  background-color: white !important;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #d1d5db;
  width: 18rem; /* w-72 */
}

/* 데스크톱에서 더 넓게 */
@media (min-width: 768px) {
  .top-list-container {
    width: 20rem; /* md:w-80 */
  }
}

/* 모바일에서 반응형 조정 */
@media (max-width: 767px) {
  .top-list-container {
    position: fixed;
    top: 1rem;
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
    max-width: calc(100vw - 1rem);
    z-index: 45;
    /* 모바일에서 기본적으로 접힌 상태로 시작 */
    max-height: 60vh;
    overflow-y: auto;
  }
}

/* 매우 작은 화면에서 추가 조정 */
@media (max-width: 480px) {
  .top-list-container {
    top: 0.5rem;
    font-size: 0.875rem;
  }

  .top-list-container h3 {
    font-size: 0.75rem;
  }

  .top-list-container .text-sm {
    font-size: 0.75rem;
  }

  .top-list-container .text-xs {
    font-size: 0.625rem;
  }
}
</style>

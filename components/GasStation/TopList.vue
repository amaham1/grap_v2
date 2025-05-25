<template>
  <div v-if="topStations.length > 0" class="absolute top-2 right-2 z-40 bg-white rounded-lg shadow-lg w-72 md:w-80 border border-gray-300" style="background-color: white !important;">
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
  console.log('[DEBUG] TopList 컴포넌트 마운트됨, topStations 길이:', props.topStations.length);
});

// topStations 변경 감지
watch(() => props.topStations, (newStations) => {
  console.log('[DEBUG] TopList topStations 변경됨:', newStations.length);
});
</script>

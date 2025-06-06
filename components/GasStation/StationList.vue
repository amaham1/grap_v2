<template>
  <div class="station-list-container">
    <!-- 최저가 TOP10 목록 -->
    <div v-if="topLowestPriceStations.length > 0" class="station-list-item">
      <div class="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 flex items-center">
          <svg class="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          최저가 TOP{{ Math.min(topLowestPriceStations.length, 10) }}
          <span class="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
            {{ selectedFuelLabel }}
          </span>
        </h3>
        <button
          @click="isTopListCollapsed = !isTopListCollapsed"
          class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': !isTopListCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>
      <div v-show="!isTopListCollapsed" class="p-3 space-y-2 max-h-80 md:max-h-96 overflow-y-auto">
        <div
          v-for="(station, index) in topLowestPriceStations"
          :key="`lowest-${station.opinet_id}`"
          @click="$emit('stationClick', station)"
          class="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
          <div class="flex items-center space-x-3 max-w-[200px] break-keep">
            <div class="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {{ index + 1 }}
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ station.name }}</div>
              <div class="text-xs text-gray-500">{{ station.address }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-red-600">
              {{ formatPrice(getStationPrice(station, selectedFuel)) }}원/L
            </div>
            <div v-if="station.distance" class="text-xs text-gray-500">
              {{ station.distance.toFixed(1) }}km
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 즐겨찾기 TOP3 목록 -->
    <div v-if="favoriteTop3Stations.length > 0" class="station-list-item">
      <div class="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 flex items-center">
          <svg class="w-4 h-4 mr-2 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"></path>
          </svg>
          즐겨찾기 TOP{{ Math.min(favoriteTop3Stations.length, 3) }}
          <span class="ml-2 text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
            {{ selectedFuelLabel }}
          </span>
        </h3>
        <button
          @click="isFavoriteListCollapsed = !isFavoriteListCollapsed"
          class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': !isFavoriteListCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>
      <div v-show="!isFavoriteListCollapsed" class="p-3 space-y-2">
        <div
          v-for="(station, index) in favoriteTop3Stations"
          :key="`favorite-${station.opinet_id}`"
          @click="$emit('stationClick', station)"
          class="flex items-center justify-between p-2 bg-pink-50 rounded-lg hover:bg-pink-100 cursor-pointer transition-colors">
          <div class="flex items-center space-x-3 max-w-[200px] break-keep">
            <div class="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {{ index + 1 }}
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ station.name }}</div>
              <div class="text-xs text-gray-500">{{ station.address }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-pink-600">
              {{ formatPrice(getStationPrice(station, selectedFuel)) }}원/L
            </div>
            <div v-if="station.distance" class="text-xs text-gray-500">
              {{ station.distance.toFixed(1) }}km
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 결과가 없을 때 -->
    <div v-if="topLowestPriceStations.length === 0 && favoriteTop3Stations.length === 0"
         class="station-list-item p-8 text-center">
      <div class="text-gray-400 text-4xl mb-4">🔍</div>
      <p class="text-gray-600 text-sm">주변 주유소를 검색해보세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GasStation } from '~/types/gasStation';
import { formatPrice, getStationPrice, fuelTypes } from '~/utils/gasStationUtils';

interface Props {
  topLowestPriceStations: GasStation[];
  favoriteTop3Stations: GasStation[];
  selectedFuel: string;
}

interface Emits {
  (e: 'stationClick', station: GasStation): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 접기/펴기 상태
const isTopListCollapsed = ref(false); // 최저가 TOP 목록 접힌 상태
const isFavoriteListCollapsed = ref(false); // 즐겨찾기 TOP 목록 접힌 상태

// 선택된 연료 타입 라벨
const selectedFuelLabel = computed(() => {
  const fuelType = fuelTypes.find(fuel => fuel.value === props.selectedFuel);
  return fuelType ? fuelType.label : '전체';
});
</script>

<style scoped>
.station-list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.station-list-item {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

/* 모바일에서 반응형 조정 */
@media (max-width: 767px) {
  .station-list-container {
    position: fixed;
    top: 12rem; /* TopList 아래에 위치 */
    left: 0.5rem;
    right: 0.5rem;
    z-index: 44;
    max-height: calc(100vh - 16rem);
    overflow-y: auto;
    /* 모바일 하단 탭과 겹치지 않도록 여백 추가 */
    bottom: 6rem;
  }

  .station-list-item {
    margin-bottom: 0.5rem;
  }

  .station-list-item h3 {
    font-size: 0.75rem;
  }

  .station-list-item .text-sm {
    font-size: 0.75rem;
  }

  .station-list-item .text-xs {
    font-size: 0.625rem;
  }
}

/* 매우 작은 화면에서 추가 조정 */
@media (max-width: 480px) {
  .station-list-container {
    top: 10rem;
    max-height: calc(100vh - 14rem);
    bottom: 5rem;
  }
}

/* 데스크톱에서는 기본 스타일 유지 */
@media (min-width: 768px) {
  .station-list-container {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}
</style>

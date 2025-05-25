<template>
  <div class="absolute top-2 left-2 z-40 bg-white rounded-lg shadow-lg max-w-md border border-gray-300" style="background-color: white !important;">
    <!-- 패널 헤더 (항상 표시) -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200">
      <h3 class="text-sm font-semibold text-gray-700">검색 설정</h3>
      <button
        @click="isCollapsed = !isCollapsed"
        class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
        <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': !isCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>

    <!-- 패널 내용 (접을 수 있음) -->
    <div v-show="!isCollapsed" class="p-3 space-y-4">
      <!-- 위치 정보 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">내 위치 기준 검색</span>
          <button
            @click="handleGetCurrentLocation"
            :disabled="isGettingLocation"
            class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
            {{ isGettingLocation ? '위치 확인 중...' : '현재 위치' }}
          </button>
        </div>
        <div v-if="userLocation" class="text-xs text-gray-600">
          위도: {{ userLocation.latitude.toFixed(6) }}, 경도: {{ userLocation.longitude.toFixed(6) }}
        </div>
      </div>

      <!-- 반경 설정 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          검색 반경: {{ searchRadius }}km
        </label>
        <input
          v-model="searchRadius"
          type="range"
          min="1"
          max="10"
          step="0.5"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>1km</span>
          <span>10km</span>
        </div>
      </div>

      <!-- 연료 타입 필터 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">연료 종류</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="fuel in fuelTypes"
            :key="fuel.value"
            @click="selectedFuel = selectedFuel === fuel.value ? '' : fuel.value"
            :class="[
              'px-3 py-1 text-xs rounded-full border transition-colors flex-shrink-0',
              selectedFuel === fuel.value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
            ]">
            {{ fuel.label }}
          </button>
        </div>
      </div>

      <!-- 검색 버튼 -->
      <button
        @click="handleSearch"
        :disabled="!userLocation || isSearching"
        class="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 text-sm font-medium">
        {{ isSearching ? '검색 중...' : '주변 주유소 검색' }}
      </button>

      <!-- 검색 결과 요약 -->
      <div v-if="searchStats" class="text-xs text-gray-600">
        반경 {{ searchRadius }}km 내 {{ searchStats.total_in_radius }}개 주유소 발견
        <span v-if="searchStats.lowest_price_count > 0" class="text-green-600 font-medium">
          (최저가 {{ searchStats.lowest_price_count }}개)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserLocation, SearchStats } from '~/types/gasStation';
import { fuelTypes } from '~/utils/gasStationUtils';

interface Props {
  userLocation: UserLocation | null;
  isGettingLocation: boolean;
  searchRadius: number;
  selectedFuel: string;
  isSearching: boolean;
  searchStats: SearchStats | null;
}

interface Emits {
  (e: 'update:searchRadius', value: number): void;
  (e: 'update:selectedFuel', value: string): void;
  (e: 'getCurrentLocation'): void;
  (e: 'search'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isCollapsed = ref(true);

const searchRadius = computed({
  get: () => props.searchRadius,
  set: (value) => emit('update:searchRadius', value)
});

const selectedFuel = computed({
  get: () => props.selectedFuel,
  set: (value) => emit('update:selectedFuel', value)
});

const handleGetCurrentLocation = () => {
  emit('getCurrentLocation');
};

const handleSearch = () => {
  emit('search');
};

// 컴포넌트 마운트 확인
onMounted(() => {
  console.log('[DEBUG] SearchPanel 컴포넌트 마운트됨');
});
</script>

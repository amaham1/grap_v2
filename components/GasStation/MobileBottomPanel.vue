<template>
  <div class="mobile-bottom-panel-wrapper">
    <!-- 화살표 버튼 (항상 표시) -->
    <button
      @click="togglePanel"
      class="mobile-toggle-button"
      :class="{ 'panel-open': isPanelOpen }"
    >
      <svg 
        class="w-6 h-6 transform transition-transform duration-300" 
        :class="{ 'rotate-180': isPanelOpen }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
      </svg>
    </button>

    <!-- 슬라이드업 패널 -->
    <div
      v-show="isPanelOpen"
      class="mobile-panel"
    >
      <!-- 패널 헤더 (탭 버튼들) -->
      <div class="panel-header">
        <button
          @click="activeTab = 'lowest'"
          class="tab-button"
          :class="{ 'active': activeTab === 'lowest' }"
        >
          <span class="tab-icon">🏆</span>
          <span class="tab-text">최저가 TOP</span>
        </button>
        <button
          @click="activeTab = 'favorites'"
          class="tab-button"
          :class="{ 'active': activeTab === 'favorites' }"
        >
          <span class="tab-icon">⭐</span>
          <span class="tab-text">즐겨찾기 TOP</span>
        </button>
      </div>

      <!-- 패널 내용 -->
      <div class="panel-content">
        <!-- 최저가 TOP 탭 -->
        <div v-if="activeTab === 'lowest'" class="tab-content">
          <div v-if="topLowestPriceStations.length > 0" class="station-list">
            <div class="list-header">
              <h3 class="list-title">
                🏆 최저가 TOP{{ Math.min(topLowestPriceStations.length, 10) }}
                <span v-if="selectedFuel" class="fuel-badge">
                  {{ fuelTypes.find(f => f.value === selectedFuel)?.label }}
                </span>
              </h3>
            </div>
            <div class="station-items">
              <div
                v-for="(station, index) in topLowestPriceStations.slice(0, 10)"
                :key="`lowest-${station.opinet_id}`"
                @click="handleStationClick(station)"
                class="station-item"
              >
                <div class="station-rank">{{ index + 1 }}</div>
                <div class="station-info">
                  <h4 class="station-name">{{ station.name }}</h4>
                  <p class="station-brand">{{ station.brand?.name }}</p>
                  <p class="station-address">{{ station.address }}</p>
                </div>
                <div class="station-price">
                  <span class="price-value">{{ formatPrice(getStationPrice(station, selectedFuel)) }}</span>
                  <span class="price-unit">원</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>검색된 주유소가 없습니다.</p>
          </div>
        </div>

        <!-- 즐겨찾기 TOP 탭 -->
        <div v-if="activeTab === 'favorites'" class="tab-content">
          <div v-if="favoriteTop3Stations.length > 0" class="station-list">
            <div class="list-header">
              <h3 class="list-title">
                ⭐ 즐겨찾기 TOP{{ Math.min(favoriteTop3Stations.length, 3) }}
                <span v-if="selectedFuel" class="fuel-badge">
                  {{ fuelTypes.find(f => f.value === selectedFuel)?.label }}
                </span>
              </h3>
            </div>
            <div class="station-items">
              <div
                v-for="(station, index) in favoriteTop3Stations"
                :key="`favorite-${station.opinet_id}`"
                @click="handleStationClick(station)"
                class="station-item"
              >
                <div class="station-rank favorite">{{ index + 1 }}</div>
                <div class="station-info">
                  <h4 class="station-name">{{ station.name }}</h4>
                  <p class="station-brand">{{ station.brand?.name }}</p>
                  <p class="station-address">{{ station.address }}</p>
                </div>
                <div class="station-price">
                  <span class="price-value">{{ formatPrice(getStationPrice(station, selectedFuel)) }}</span>
                  <span class="price-unit">원</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>즐겨찾기한 주유소가 없습니다.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 배경 오버레이 (패널이 열렸을 때) -->
    <div 
      v-if="isPanelOpen"
      @click="closePanel"
      class="panel-overlay"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { GasStation } from '~/types/gasStation';
import { formatPrice, getStationPrice } from '~/utils/gasStationUtils';

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

// 반응형 상태
const isPanelOpen = ref(false);
const activeTab = ref<'lowest' | 'favorites'>('lowest');

// 연료 타입 정의
const fuelTypes = [
  { value: 'gasoline', label: '휘발유' },
  { value: 'diesel', label: '경유' },
  { value: 'lpg', label: 'LPG' },
  { value: 'premium_gasoline', label: '고급휘발유' }
];

// 패널 토글
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
};

// 패널 닫기
const closePanel = () => {
  isPanelOpen.value = false;
};

// 주유소 클릭 핸들러
const handleStationClick = (station: GasStation) => {
  emit('stationClick', station);
  closePanel(); // 주유소 선택 후 패널 닫기
};

// 화면 크기 변경 감지하여 데스크톱에서는 패널 닫기
const checkScreenSize = () => {
  if (window.innerWidth > 768) {
    isPanelOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<style scoped>
/* 모바일 전용 - 768px 이하에서만 표시 */
.mobile-bottom-panel-wrapper {
  display: none;
}

@media (max-width: 768px) {
  .mobile-bottom-panel-wrapper {
    display: block;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
  }

  /* 화살표 토글 버튼 */
  .mobile-toggle-button {
    position: absolute;
    bottom: 0; /* 모바일 광고 높이(66px) 위에 위치 */
    left: 1rem;
    width: 3rem;
    height: 3rem;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem 0.5rem 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
    transition: all 0.3s ease;
    z-index: 52;
  }

  .mobile-toggle-button:hover {
    background-color: #f9fafb;
  }

  .mobile-toggle-button.panel-open {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  /* 슬라이드업 패널 */
  .mobile-panel {
    position: absolute;
    bottom: 66px; /* 광고 위에 위치 */
    left: 0;
    right: 0;
    background-color: white;
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    max-height: 50vh;
    overflow: hidden;
    z-index: 51;
  }

  /* 패널 헤더 (탭 버튼들) */
  .panel-header {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }

  .tab-button {
    flex: 1;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: transparent;
    border: none;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .tab-button:hover {
    background-color: #f3f4f6;
  }

  .tab-button.active {
    background-color: white;
    color: #3b82f6;
    border-bottom: 2px solid #3b82f6;
  }

  .tab-icon {
    font-size: 1rem;
  }

  .tab-text {
    font-size: 0.75rem;
  }

  /* 패널 내용 */
  .panel-content {
    height: calc(50vh - 3.5rem);
    overflow-y: auto;
  }

  .tab-content {
    padding: 0.5rem;
  }

  /* 리스트 헤더 */
  .list-header {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }

  .list-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .fuel-badge {
    font-size: 0.625rem;
    background-color: #dbeafe;
    color: #1d4ed8;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
  }

  /* 주유소 아이템들 */
  .station-items {
    padding: 0.5rem;
  }

  .station-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .station-item:hover {
    background-color: #f0f9ff;
    border-color: #3b82f6;
  }

  .station-item:last-child {
    margin-bottom: 0;
  }

  /* 순위 표시 */
  .station-rank {
    width: 1.5rem;
    height: 1.5rem;
    background-color: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .station-rank.favorite {
    background-color: #f59e0b;
  }

  /* 주유소 정보 */
  .station-info {
    flex: 1;
    min-width: 0;
  }

  .station-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .station-brand {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .station-address {
    font-size: 0.625rem;
    color: #9ca3af;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 가격 표시 */
  .station-price {
    text-align: right;
    flex-shrink: 0;
  }

  .price-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: #dc2626;
  }

  .price-unit {
    font-size: 0.625rem;
    color: #6b7280;
    margin-left: 0.125rem;
  }

  /* 빈 상태 */
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 8rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  /* 배경 오버레이 */
  .panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 45;
  }
}
</style>

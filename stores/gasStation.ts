// stores/gasStation.ts
import { defineStore } from 'pinia';
import type { GasStation, UserLocation, SearchStats, GasStationSearchParams } from '~/types/gasStation';
import { updateTopLowestPriceStations, getFavoriteTop3Stations } from '~/utils/gasStationUtils';

interface GasStationState {
  // 검색 관련 상태
  userLocation: UserLocation | null;
  isGettingLocation: boolean;
  searchRadius: number;
  selectedFuel: string;
  isSearching: boolean;
  searchStats: SearchStats | null;
  
  // 주유소 데이터
  allStations: GasStation[];
  topLowestPriceStations: GasStation[];
  favoriteTop3Stations: GasStation[];
  
  // 지도 관련 상태
  isMapLoaded: boolean;
  mapError: boolean;
  
  // 에러 상태
  lastError: string | null;
}

export const useGasStationStore = defineStore('gasStation', {
  state: (): GasStationState => ({
    // 검색 관련 상태
    userLocation: null,
    isGettingLocation: false,
    searchRadius: 5,
    selectedFuel: 'gasoline',
    isSearching: false,
    searchStats: null,
    
    // 주유소 데이터
    allStations: [],
    topLowestPriceStations: [],
    favoriteTop3Stations: [],
    
    // 지도 관련 상태
    isMapLoaded: false,
    mapError: false,
    
    // 에러 상태
    lastError: null,
  }),

  getters: {
    // 검색 가능 여부
    canSearch: (state) => !!state.userLocation && !state.isSearching,
    
    // 현재 선택된 연료 타입 라벨
    selectedFuelLabel: (state) => {
      const fuelTypes = [
        { value: '', label: '전체' },
        { value: 'gasoline', label: '휘발유' },
        { value: 'diesel', label: '경유' },
        { value: 'lpg', label: 'LPG' }
      ];
      const fuelType = fuelTypes.find(fuel => fuel.value === state.selectedFuel);
      return fuelType ? fuelType.label : '전체';
    },
    
    // 검색 결과 요약
    searchSummary: (state) => {
      if (!state.searchStats) return null;
      return {
        total: state.searchStats.total_in_radius,
        lowestPrice: state.searchStats.lowest_price_count,
        radius: state.searchRadius
      };
    },
    
    // 에러 상태 여부
    hasError: (state) => !!state.lastError,
  },

  actions: {
    // 사용자 위치 설정
    setUserLocation(location: UserLocation | null) {
      this.userLocation = location;
      this.clearError();
    },

    // 위치 가져오기 상태 설정
    setGettingLocation(isGetting: boolean) {
      this.isGettingLocation = isGetting;
    },

    // 검색 반경 설정
    setSearchRadius(radius: number) {
      this.searchRadius = Math.max(1, Math.min(20, radius));
    },

    // 연료 타입 설정
    setSelectedFuel(fuel: string) {
      this.selectedFuel = fuel;
      // 연료 타입 변경 시 TOP 목록들 업데이트
      this.updateTopLists();
    },

    // 검색 상태 설정
    setSearching(isSearching: boolean) {
      this.isSearching = isSearching;
      if (isSearching) {
        this.clearError();
      }
    },

    // 검색 통계 설정
    setSearchStats(stats: SearchStats | null) {
      this.searchStats = stats;
    },

    // 지도 로드 상태 설정
    setMapLoaded(isLoaded: boolean) {
      this.isMapLoaded = isLoaded;
      this.mapError = false;
    },

    // 지도 에러 상태 설정
    setMapError(hasError: boolean) {
      this.mapError = hasError;
      if (hasError) {
        this.isMapLoaded = false;
      }
    },

    // 주유소 데이터 설정
    setStations(stations: GasStation[]) {
      this.allStations = stations;
      this.updateTopLists();
    },

    // TOP 목록들 업데이트
    updateTopLists() {
      // 최저가 TOP10 업데이트
      this.topLowestPriceStations = updateTopLowestPriceStations(
        this.allStations, 
        this.selectedFuel
      );
      
      // 즐겨찾기 TOP3 업데이트
      this.favoriteTop3Stations = getFavoriteTop3Stations(
        this.allStations, 
        this.selectedFuel
      );
    },

    // 에러 설정
    setError(error: string) {
      this.lastError = error;
      console.error('[GasStation Store Error]:', error);
    },

    // 에러 클리어
    clearError() {
      this.lastError = null;
    },

    // 전체 상태 초기화
    resetState() {
      this.$reset();
    },

    // 검색 관련 상태만 초기화
    resetSearchState() {
      this.isSearching = false;
      this.searchStats = null;
      this.allStations = [];
      this.topLowestPriceStations = [];
      this.favoriteTop3Stations = [];
      this.clearError();
    },
  },

  // 상태 지속성은 나중에 추가 (현재는 주석 처리)
  // persist: {
  //   key: 'gasStation',
  //   storage: persistedState.sessionStorage,
  //   pick: ['searchRadius', 'selectedFuel', 'userLocation'], // 일부 상태만 지속
  // },
});

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">복지 서비스</h1>
      <p class="text-gray-600">제주도에서 제공하는 다양한 복지 서비스 정보를 확인하세요.</p>
    </div>
    
    <!-- 검색 및 필터 -->
    <SearchFilter 
      :initial-search="search" 
      placeholder="복지 서비스명 검색" 
      @search="onSearch" 
      @reset="resetFilters"
    >
      <template #filters>
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 mb-1">지역 필터</label>
          <select 
            id="location" 
            v-model="selectedLocation"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            @change="applyFilters"
          >
            <option value="">전체 지역</option>
            <option value="all">전 지역 해당</option>
            <option value="jeju">제주시</option>
            <option value="seogwipo">서귀포시</option>
          </select>
        </div>
      </template>
    </SearchFilter>
    
    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <!-- 에러 메시지 -->
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">
      복지 서비스 정보를 불러오는 중 오류가 발생했습니다.
    </div>
    
    <!-- 결과 없음 -->
    <div v-else-if="!services.length" class="text-center py-12 text-gray-500">
      검색 조건에 맞는 복지 서비스 정보가 없습니다.
    </div>
    
    <!-- 서비스 목록 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <CardWelfareService 
        v-for="service in services" 
        :key="service.id" 
        :item="service" 
      />
    </div>
    
    <!-- 페이지네이션 -->
    <div v-if="pageCount > 1" class="mt-8">
      <Pagination 
        :current-page="page" 
        :total-pages="pageCount" 
        @page-change="onPageChange" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

// 상태 관리
const search = ref('');
const selectedLocation = ref('');
const page = ref(1);
const pageSize = ref(12);

// API 호출을 위한 쿼리 매개변수
const queryParams = computed(() => {
  return {
    page: page.value,
    pageSize: pageSize.value,
    search: search.value,
    location: selectedLocation.value
  };
});

// 데이터 가져오기
const { data, pending: loading, error, refresh } = await useFetch('/api/public/welfare-services', {
  query: queryParams,
  watch: [queryParams]
});

// 결과 데이터
const services = computed(() => data.value?.items || []);
const pageCount = computed(() => data.value?.pagination?.pageCount || 0);

// 검색 처리
function onSearch(searchText: string) {
  search.value = searchText;
  page.value = 1; // 검색 시 첫 페이지로 이동
}

// 필터 적용
function applyFilters() {
  page.value = 1; // 필터 변경 시 첫 페이지로 이동
}

// 필터 초기화
function resetFilters() {
  search.value = '';
  selectedLocation.value = '';
  page.value = 1;
}

// 페이지 변경
function onPageChange(newPage: number) {
  page.value = newPage;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

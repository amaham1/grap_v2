<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">행사/축제</h1>
      <p class="text-gray-600">제주도에서 진행되는 다양한 행사와 축제 정보를 확인하세요.</p>
    </div>
    
    <!-- 검색 및 필터 -->
    <SearchFilter 
      :initial-search="search" 
      placeholder="행사/축제명 검색" 
      @search="onSearch" 
      @reset="resetFilters"
    >
      <template #filters>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="sortBy" class="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
            <select 
              id="sortBy" 
              v-model="sortBy"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              @change="applyFilters"
            >
              <option value="written_date">작성일</option>
              <option value="title">제목</option>
            </select>
          </div>
          
          <div>
            <label for="sortOrder" class="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
            <select 
              id="sortOrder" 
              v-model="sortOrder"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              @change="applyFilters"
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>
        </div>
      </template>
    </SearchFilter>
    
    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <!-- 에러 메시지 -->
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">
      행사/축제 정보를 불러오는 중 오류가 발생했습니다.
    </div>
    
    <!-- 결과 없음 -->
    <div v-else-if="!festivals.length" class="text-center py-12 text-gray-500">
      검색 조건에 맞는 행사/축제 정보가 없습니다.
    </div>
    
    <!-- 행사/축제 목록 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <CardFestival 
        v-for="festival in festivals" 
        :key="festival.id" 
        :item="festival" 
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
const sortBy = ref('written_date');
const sortOrder = ref('desc');
const page = ref(1);
const pageSize = ref(12);

// API 호출을 위한 쿼리 매개변수
const queryParams = computed(() => {
  return {
    page: page.value,
    pageSize: pageSize.value,
    search: search.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  };
});

// 데이터 가져오기
const { data, pending: loading, error, refresh } = await useFetch('/api/public/festivals', {
  query: queryParams,
  watch: [queryParams],
  onResponse({ request, response, options }) {
    // API 요청 및 응답 로그
    console.log('행사/축제 API 요청 파라미터:', request);
    console.log('행사/축제 API 응답 데이터:', response._data);
  },
  onResponseError({ request, response, options }) {
    // API 오류 로그
    console.error('행사/축제 API 오류:', response._data);
  }
});

// 결과 데이터
const festivals = computed(() => {
  const items = data.value?.items || [];
  console.log('행사/축제 데이터 항목 개수:', items.length);
  return items;
});
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
  sortBy.value = 'written_date';
  sortOrder.value = 'desc';
  page.value = 1;
}

// 페이지 변경
function onPageChange(newPage: number) {
  page.value = newPage;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

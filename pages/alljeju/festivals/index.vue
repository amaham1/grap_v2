<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">행사/축제</h1>
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
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
    <ClientOnly>
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- 에러 메시지 -->
      <div v-else-if="error" class="toss-card p-4 border-red-200 bg-red-50 mb-6">
        <div class="text-red-700 text-sm">행사/축제 정보를 불러오는 중 오류가 발생했습니다.</div>
      </div>

      <!-- 결과 없음 -->
      <div v-else-if="!festivals.length" class="text-center py-12">
        <div class="text-gray-500">검색 조건에 맞는 행사/축제 정보가 없습니다.</div>
      </div>

      <!-- 행사/축제 목록 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <CardFestival
          v-for="festival in festivals"
          :key="festival.id"
          :item="festival"
        />
      </div>

      <template #fallback>
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </template>
    </ClientOnly>

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
import SearchFilter from '~/components/public/SearchFilter.vue';
import CardFestival from '~/components/public/CardFestival.vue';
import Pagination from '~/components/public/Pagination.vue';

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
  savePageState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 페이지 상태 저장
function savePageState() {
  if (process.client) {
    const state = {
      page: page.value,
      search: search.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      timestamp: Date.now()
    };
    sessionStorage.setItem('festivals-state', JSON.stringify(state));
  }
}

// 페이지 상태 복원
function restorePageState() {
  if (process.client) {
    const savedState = sessionStorage.getItem('festivals-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // 5분 이내의 상태만 복원
        if (Date.now() - state.timestamp < 5 * 60 * 1000) {
          page.value = state.page || 1;
          search.value = state.search || '';
          sortBy.value = state.sortBy || 'written_date';
          sortOrder.value = state.sortOrder || 'desc';
        }
      } catch (error) {
        console.warn('Failed to restore page state:', error);
      }
    }
  }
}

// 컴포넌트 마운트 시 상태 복원
onMounted(() => {
  // 뒤로가기로 인한 접속인지 확인
  if (process.client) {
    const shouldRestore = sessionStorage.getItem('should-restore-festivals-state');
    if (shouldRestore === 'true') {
      sessionStorage.removeItem('should-restore-festivals-state');
      restorePageState();
    }
  }
});

// 검색/필터 변경 시 상태 저장
watch([search, sortBy, sortOrder], () => {
  savePageState();
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">공연/전시</h1>
      <p class="text-gray-600">제주도에서 진행되는 다양한 공연과 전시 정보를 확인하세요.</p>
    </div>

    <!-- 검색 및 필터 -->
    <SearchFilter
      :initial-search="search"
      placeholder="공연/전시명 검색"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #filters>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              id="category"
              v-model="category"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              @change="applyFilters"
            >
              <option value="">전체</option>
              <option value="전시">전시</option>
              <option value="공연">공연</option>
              <option value="행사">행사</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label for="showPast" class="block text-sm font-medium text-gray-700 mb-1">종료된 공연/전시</label>
            <select
              id="showPast"
              v-model="showPast"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              @change="applyFilters"
            >
              <option :value="false">진행/예정 중인 항목만</option>
              <option :value="true">모든 항목 보기</option>
            </select>
          </div>

          <div>
            <label for="sortBy" class="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
            <select
              id="sortBy"
              v-model="sortBy"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              @change="applyFilters"
            >
              <option value="start_date">시작일</option>
              <option value="end_date">종료일</option>
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
        <div class="text-red-700 text-sm">공연/전시 정보를 불러오는 중 오류가 발생했습니다.</div>
      </div>

      <!-- 결과 없음 -->
      <div v-else-if="!exhibitions.length" class="text-center py-12">
        <div class="text-gray-500">검색 조건에 맞는 공연/전시 정보가 없습니다.</div>
      </div>

      <!-- 공연/전시 목록 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <CardExhibition
          v-for="exhibition in exhibitions"
          :key="exhibition.id"
          :item="exhibition"
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
import CardExhibition from '~/components/public/CardExhibition.vue';
import Pagination from '~/components/public/Pagination.vue';

definePageMeta({
  layout: 'public'
});

// 페이지 상태 관리 composable 사용
const pageStateManager = usePageState({
  key: 'exhibitions',
  defaultState: {
    page: 1,
    search: '',
    category: '',
    showPast: true,
    sortBy: 'start_date',
    sortOrder: 'desc'
  }
});

// 반응형 상태 참조
const search = computed({
  get: () => pageStateManager.state.value.search,
  set: (value) => pageStateManager.updateSearch(value)
});

const category = computed({
  get: () => pageStateManager.state.value.category,
  set: (value) => pageStateManager.updateFilters({ category: value })
});

const showPast = computed({
  get: () => pageStateManager.state.value.showPast,
  set: (value) => pageStateManager.updateFilters({ showPast: value })
});

const sortBy = computed({
  get: () => pageStateManager.state.value.sortBy,
  set: (value) => pageStateManager.updateFilters({ sortBy: value })
});

const sortOrder = computed({
  get: () => pageStateManager.state.value.sortOrder,
  set: (value) => pageStateManager.updateFilters({ sortOrder: value })
});

const page = computed({
  get: () => pageStateManager.state.value.page,
  set: (value) => pageStateManager.updatePage(value)
});

const pageSize = ref(12);

// API 호출을 위한 쿼리 매개변수
const queryParams = computed(() => {
  return {
    page: page.value,
    pageSize: pageSize.value,
    search: search.value,
    category: category.value,
    showPast: showPast.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  };
});

// 데이터 가져오기
const { data, pending: loading, error, refresh } = await useFetch('/api/public/exhibitions', {
  query: queryParams,
  watch: [queryParams],
});

// 결과 데이터
const exhibitions = computed(() => {
  const items = data.value?.items || [];
  return items;
});
const pageCount = computed(() => data.value?.pagination?.pageCount || 0);

// 검색 처리
function onSearch(searchText: string) {
  search.value = searchText; // computed setter가 자동으로 상태 저장
}

// 필터 적용
function applyFilters() {
  // 필터 변경은 computed setter에서 자동으로 처리됨
}

// 필터 초기화
function resetFilters() {
  pageStateManager.saveState({
    search: '',
    category: '',
    showPast: true,
    sortBy: 'start_date',
    sortOrder: 'desc',
    page: 1
  });
}

// 페이지 변경
function onPageChange(newPage: number) {
  page.value = newPage; // computed setter가 자동으로 상태 저장
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 컴포넌트 마운트 시 상태 복원
onMounted(() => {
  // 초기화 시 이미 복원되었거나, 뒤로가기로 인한 접속인지 확인
  if (pageStateManager.wasInitiallyRestored()) {
    // 초기화 시 복원된 경우 데이터 다시 로드
    nextTick(() => {
      refresh();
    });
  } else if (pageStateManager.tryRestore()) {
    // 상태 복원 후 데이터 다시 로드
    nextTick(() => {
      refresh();
    });
  }
});
</script>

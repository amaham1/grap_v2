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

// SEO 최적화된 축제 페이지 메타 정보
useHead({
  title: '제주도 축제 및 행사 정보 | 실시간 업데이트 - Grap',
  meta: [
    { name: 'description', content: '제주도에서 열리는 다양한 축제와 행사 정보를 실시간으로 확인하세요. 제주도 대표 축제부터 지역 소규모 행사까지 모든 정보를 한곳에서 제공합니다.' },
    { name: 'keywords', content: '제주도 축제, 제주 행사, 제주도 이벤트, 제주 축제 일정, 제주도 문화행사, 제주 관광축제, 제주도 지역축제' },
    { property: 'og:title', content: '제주도 축제 및 행사 정보 | 실시간 업데이트 - Grap' },
    { property: 'og:description', content: '제주도에서 열리는 다양한 축제와 행사 정보를 실시간으로 확인하세요. 제주도 대표 축제부터 지역 소규모 행사까지 모든 정보를 한곳에서 제공합니다.' },
    { property: 'og:url', content: 'https://grap.co.kr/alljeju/festivals' },
    { name: 'twitter:title', content: '제주도 축제 및 행사 정보 | 실시간 업데이트 - Grap' },
    { name: 'twitter:description', content: '제주도에서 열리는 다양한 축제와 행사 정보를 실시간으로 확인하세요.' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: '제주도 축제 및 행사 정보',
        description: '제주도에서 열리는 다양한 축제와 행사 정보를 실시간으로 확인하세요. 제주도 대표 축제부터 지역 소규모 행사까지 모든 정보를 한곳에서 제공합니다.',
        url: 'https://grap.co.kr/alljeju/festivals',
        mainEntity: {
          '@type': 'ItemList',
          name: '제주도 축제 목록',
          description: '제주도에서 개최되는 축제와 행사들의 목록',
          itemListElement: []
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: '홈',
              item: 'https://grap.co.kr/alljeju'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: '행사/축제',
              item: 'https://grap.co.kr/alljeju/festivals'
            }
          ]
        }
      })
    }
  ]
});

// 페이지 상태 관리 composable 사용
const pageStateManager = usePageState({
  key: 'festivals',
  defaultState: {
    page: 1,
    search: '',
    sortBy: 'written_date',
    sortOrder: 'desc'
  }
});

// 반응형 상태 참조
const search = computed({
  get: () => pageStateManager.state.value.search,
  set: (value) => pageStateManager.updateSearch(value)
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
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  };
});

// 데이터 가져오기
const { data, pending: loading, error, refresh } = await useFetch('/api/public/festivals', {
  query: queryParams,
  watch: [queryParams],
});

// 결과 데이터
const festivals = computed(() => {
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
    sortBy: 'written_date',
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

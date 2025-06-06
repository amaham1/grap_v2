<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">복지 서비스</h1>
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
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
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
    <ClientOnly>
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- 에러 메시지 -->
      <div v-else-if="error" class="toss-card p-4 border-red-200 bg-red-50 mb-6">
        <div class="text-red-700 text-sm">복지 서비스 정보를 불러오는 중 오류가 발생했습니다.</div>
      </div>

      <!-- 결과 없음 -->
      <div v-else-if="!services.length" class="text-center py-12">
        <div class="text-gray-500">검색 조건에 맞는 복지 서비스 정보가 없습니다.</div>
      </div>

      <!-- 서비스 목록 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <CardWelfareService
          v-for="service in services"
          :key="service.id"
          :item="service"
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
import CardWelfareService from '~/components/public/CardWelfareService.vue';
import Pagination from '~/components/public/Pagination.vue';

definePageMeta({
  layout: 'public'
});

// SEO 최적화된 복지서비스 페이지 메타 정보
useHead({
  title: '제주도 복지서비스 정보 | 지원 프로그램 안내 - Grap',
  meta: [
    { name: 'description', content: '제주도 복지서비스 및 지원 프로그램 정보를 확인하세요. 생활지원, 의료지원, 교육지원, 주거지원 등 다양한 제주도 복지혜택을 한곳에서 제공합니다.' },
    { name: 'keywords', content: '제주도 복지서비스, 제주 지원프로그램, 제주도 생활지원, 제주 의료지원, 제주도 교육지원, 제주 주거지원, 제주도 복지혜택' },
    { property: 'og:title', content: '제주도 복지서비스 정보 | 지원 프로그램 안내 - Grap' },
    { property: 'og:description', content: '제주도 복지서비스 및 지원 프로그램 정보를 확인하세요. 생활지원, 의료지원, 교육지원, 주거지원 등 다양한 제주도 복지혜택을 한곳에서 제공합니다.' },
    { property: 'og:url', content: 'https://grap.co.kr/alljeju/welfare-services' },
    { name: 'twitter:title', content: '제주도 복지서비스 정보 | 지원 프로그램 안내 - Grap' },
    { name: 'twitter:description', content: '제주도 복지서비스 및 지원 프로그램 정보를 확인하세요.' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: '제주도 복지서비스 정보',
        description: '제주도 복지서비스 및 지원 프로그램 정보를 확인하세요. 생활지원, 의료지원, 교육지원, 주거지원 등 다양한 제주도 복지혜택을 한곳에서 제공합니다.',
        url: 'https://grap.co.kr/alljeju/welfare-services',
        mainEntity: {
          '@type': 'ItemList',
          name: '제주도 복지서비스 목록',
          description: '제주도에서 제공하는 복지서비스와 지원 프로그램들의 목록',
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
              name: '복지 서비스',
              item: 'https://grap.co.kr/alljeju/welfare-services'
            }
          ]
        }
      })
    }
  ]
});

// 페이지 상태 관리 composable 사용
const pageStateManager = usePageState({
  key: 'welfare-services',
  defaultState: {
    page: 1,
    search: '',
    selectedLocation: ''
  }
});

// 반응형 상태 참조
const search = computed({
  get: () => pageStateManager.state.value.search,
  set: (value) => pageStateManager.updateSearch(value)
});

const selectedLocation = computed({
  get: () => pageStateManager.state.value.selectedLocation,
  set: (value) => pageStateManager.updateFilters({ selectedLocation: value })
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
    selectedLocation: '',
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

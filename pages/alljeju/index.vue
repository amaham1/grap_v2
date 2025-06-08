<template>
  <div>
    <!-- 히어로 섹션 -->
    <section class="relative py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <!-- 메인 타이틀 -->
        <h1 class="text-3xl md:text-4xl font-medium text-gray-900 mb-6 leading-tight">
          제주도 생활정보
          <span class="block text-lg md:text-xl font-light text-gray-600 mt-2">
            필요한 정보를 한곳에서
          </span>
        </h1>

        <!-- 서브 타이틀 -->
        <p class="text-base text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          복지 서비스, 행사/축제, 공연/전시 정보를 간편하게 찾아보세요
        </p>

        <!-- 카테고리 카드들 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <NuxtLink
            to="/alljeju/welfare-services"
            class="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg smooth-transition text-center transform hover:-translate-y-1"
          >
            <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 smooth-transition">
              <div class="w-6 h-6 bg-blue-500 rounded-full"></div>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">복지 서비스</h3>
            <p class="text-xs text-gray-500">지원 정보</p>
          </NuxtLink>

          <NuxtLink
            to="/alljeju/festivals"
            class="group bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg smooth-transition text-center transform hover:-translate-y-1"
          >
            <div class="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-100 smooth-transition">
              <div class="w-6 h-6 bg-orange-500 rounded-full"></div>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">행사/축제</h3>
            <p class="text-xs text-gray-500">이벤트 정보</p>
          </NuxtLink>

          <NuxtLink
            to="/alljeju/exhibitions"
            class="group bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg smooth-transition text-center transform hover:-translate-y-1"
          >
            <div class="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-100 smooth-transition">
              <div class="w-6 h-6 bg-purple-500 rounded-full"></div>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">공연/전시</h3>
            <p class="text-xs text-gray-500">문화 정보</p>
          </NuxtLink>

          <NuxtLink
            to="/alljeju/gas-stations"
            class="group bg-white p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg smooth-transition text-center transform hover:-translate-y-1"
          >
            <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100 smooth-transition">
              <div class="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">주유소</h3>
            <p class="text-xs text-gray-500">가격 정보</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 최신 복지 서비스 섹션 -->
    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center space-x-3">
            <div class="w-1 h-8 bg-blue-500 rounded-full"></div>
            <h2 class="text-xl font-semibold text-gray-900">복지 서비스</h2>
          </div>
          <NuxtLink
            to="/alljeju/welfare-services"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium smooth-transition"
          >
            전체 보기 →
          </NuxtLink>
        </div>

        <ClientOnly>
          <div v-if="welfareServicesLoading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
          </div>

          <div v-else-if="welfareServicesError" class="text-center py-8">
            <div class="text-gray-500 text-sm">정보를 불러올 수 없습니다.</div>
          </div>

          <div v-else-if="!welfareServices.length" class="text-center py-8">
            <div class="text-gray-500 text-sm">표시할 정보가 없습니다.</div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardWelfareService
              v-for="service in welfareServices"
              :key="service.id"
              :item="service as any"
            />
          </div>

          <template #fallback>
            <div class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- 진행 중인 공연/전시 섹션 -->
    <section class="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-4xl mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center space-x-3">
            <div class="w-1 h-8 bg-purple-500 rounded-full"></div>
            <h2 class="text-xl font-semibold text-gray-900">공연/전시</h2>
          </div>
          <NuxtLink
            to="/alljeju/exhibitions"
            class="text-sm text-purple-600 hover:text-purple-800 font-medium smooth-transition"
          >
            전체 보기 →
          </NuxtLink>
        </div>

        <ClientOnly>
          <div v-if="exhibitionsLoading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
          </div>

          <div v-else-if="exhibitionsError" class="text-center py-8">
            <div class="text-gray-500 text-sm">정보를 불러올 수 없습니다.</div>
          </div>

          <div v-else-if="!exhibitions.length" class="text-center py-8">
            <div class="text-gray-500 text-sm">표시할 정보가 없습니다.</div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardExhibition
              v-for="exhibition in exhibitions"
              :key="exhibition.id"
              :item="exhibition as any"
            />
          </div>

          <template #fallback>
            <div class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- 최신 행사/축제 섹션 -->
    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center space-x-3">
            <div class="w-1 h-8 bg-orange-500 rounded-full"></div>
            <h2 class="text-xl font-semibold text-gray-900">행사/축제</h2>
          </div>
          <NuxtLink
            to="/alljeju/festivals"
            class="text-sm text-orange-600 hover:text-orange-800 font-medium smooth-transition"
          >
            전체 보기 →
          </NuxtLink>
        </div>

        <ClientOnly>
          <div v-if="festivalsLoading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
          </div>

          <div v-else-if="festivalsError" class="text-center py-8">
            <div class="text-gray-500 text-sm">정보를 불러올 수 없습니다.</div>
          </div>

          <div v-else-if="!festivals.length" class="text-center py-8">
            <div class="text-gray-500 text-sm">표시할 정보가 없습니다.</div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardFestival
              v-for="festival in festivals"
              :key="festival.id"
              :item="festival as any"
            />
          </div>

          <template #fallback>
            <div class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 컴포넌트 import
import CardWelfareService from '~/components/public/CardWelfareService.vue';
import CardExhibition from '~/components/public/CardExhibition.vue';
import CardFestival from '~/components/public/CardFestival.vue';

definePageMeta({
  layout: 'public'
});

// SEO 최적화된 홈페이지 메타 정보
useHead({
  title: 'Grap - 제주도 생활정보 플랫폼 | 주유소, 축제, 전시회, 복지서비스',
  meta: [
    { name: 'description', content: '제주도 생활에 필요한 모든 정보를 한곳에서! 실시간 주유소 최저가 정보, 축제 및 행사, 전시회, 복지서비스 정보를 제공하는 제주도 대표 생활정보 플랫폼입니다.' },
    { name: 'keywords', content: '제주도, 제주 생활정보, 제주도 주유소, 제주 축제, 제주도 전시회, 제주 복지서비스, 제주도 여행, 제주 관광, 제주도 정보' },
    { property: 'og:title', content: 'Grap - 제주도 생활정보 플랫폼' },
    { property: 'og:description', content: '제주도 생활에 필요한 모든 정보를 한곳에서! 실시간 주유소 최저가 정보, 축제 및 행사, 전시회, 복지서비스 정보를 제공하는 제주도 대표 생활정보 플랫폼입니다.' },
    { property: 'og:url', content: 'https://grap.co.kr/alljeju' },
    { name: 'twitter:title', content: 'Grap - 제주도 생활정보 플랫폼' },
    { name: 'twitter:description', content: '제주도 생활에 필요한 모든 정보를 한곳에서! 실시간 주유소 최저가 정보, 축제 및 행사, 전시회, 복지서비스 정보를 제공합니다.' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Grap - 제주도 생활정보 플랫폼',
        description: '제주도 생활에 필요한 모든 정보를 한곳에서! 실시간 주유소 최저가 정보, 축제 및 행사, 전시회, 복지서비스 정보를 제공하는 제주도 대표 생활정보 플랫폼입니다.',
        url: 'https://grap.co.kr',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://grap.co.kr/alljeju/gas-stations?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Grap',
          url: 'https://grap.co.kr'
        },
        mainEntity: [
          {
            '@type': 'Service',
            name: '제주도 주유소 정보',
            description: '제주도 내 모든 주유소의 실시간 가격 정보와 위치 제공',
            url: 'https://grap.co.kr/alljeju/gas-stations'
          },
          {
            '@type': 'Service',
            name: '제주도 축제 정보',
            description: '제주도에서 열리는 다양한 축제와 행사 정보 제공',
            url: 'https://grap.co.kr/alljeju/festivals'
          },
          {
            '@type': 'Service',
            name: '제주도 전시회 정보',
            description: '제주도 내 공연 및 전시회 정보 제공',
            url: 'https://grap.co.kr/alljeju/exhibitions'
          },
          {
            '@type': 'Service',
            name: '제주도 복지서비스 정보',
            description: '제주도 복지서비스 및 지원 프로그램 정보 제공',
            url: 'https://grap.co.kr/alljeju/welfare-services'
          }
        ]
      })
    }
  ]
});

// 복지 서비스 데이터 로드
const {
  data: welfareServicesData,
  pending: welfareServicesLoading,
  error: welfareServicesError
} = await useFetch('/api/public/welfare-services', {
  query: {
    page: 1,
    pageSize: 3
  }
});

const welfareServices = computed(() => welfareServicesData.value?.items || []);

// 공연/전시 데이터 로드 (현재 진행 중인 것만)
const {
  data: exhibitionsData,
  pending: exhibitionsLoading,
  error: exhibitionsError
} = await useFetch('/api/public/exhibitions', {
  query: {
    page: 1,
    pageSize: 3,
    showPast: false
  }
});

const exhibitions = computed(() => exhibitionsData.value?.items || []);

// 행사/축제 데이터 로드
const {
  data: festivalsData,
  pending: festivalsLoading,
  error: festivalsError
} = await useFetch('/api/public/festivals', {
  query: {
    page: 1,
    pageSize: 3,
    sortBy: 'written_date',
    sortOrder: 'desc'
  }
});

const festivals = computed(() => festivalsData.value?.items || []);
</script>

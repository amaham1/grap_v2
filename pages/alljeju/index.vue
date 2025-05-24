<template>
  <div>
    <!-- 히어로 섹션 -->
    <section class="py-12 lg:py-16 toss-gradient text-white">
      <div class="max-w-5xl mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-2xl lg:text-3xl font-bold mb-4">
            무엇을 도와드릴까요?
          </h1>
          <p class="text-base lg:text-lg mb-8 text-blue-100">
            제주도의 복지 서비스, 행사/축제, 공연/전시 정보를 쉽고 빠르게 찾아보세요.
          </p>

          <!-- 빠른 링크 버튼들 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NuxtLink
              to="/alljeju/welfare-services"
              class="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 text-white p-3 rounded-xl hover:bg-opacity-20 smooth-transition text-center"
            >
              <div class="text-sm font-medium">복지 서비스</div>
              <div class="text-xs text-blue-100 mt-1">제주도 복지 서비스 정보</div>
            </NuxtLink>
            <NuxtLink
              to="/alljeju/festivals"
              class="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 text-white p-3 rounded-xl hover:bg-opacity-20 smooth-transition text-center"
            >
              <div class="text-sm font-medium">행사/축제</div>
              <div class="text-xs text-blue-100 mt-1">제주도 행사 및 축제 정보</div>
            </NuxtLink>
            <NuxtLink
              to="/alljeju/exhibitions"
              class="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 text-white p-3 rounded-xl hover:bg-opacity-20 smooth-transition text-center"
            >
              <div class="text-sm font-medium">공연/전시</div>
              <div class="text-xs text-blue-100 mt-1">제주도 공연 및 전시 정보</div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 최신 복지 서비스 섹션 -->
    <section class="py-12 bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">최신 복지 서비스</h2>
          <NuxtLink to="/alljeju/welfare-services" class="text-sm text-blue-600 hover:text-blue-700 font-medium smooth-transition flex items-center">
            모두 보기
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </NuxtLink>
        </div>

        <ClientOnly>
          <div v-if="welfareServicesLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="welfareServicesError" class="toss-card p-4 border-red-200 bg-red-50">
            <div class="text-red-700 text-sm">복지 서비스 정보를 불러오는 중 오류가 발생했습니다.</div>
          </div>

          <div v-else-if="!welfareServices.length" class="text-center py-12">
            <div class="text-gray-500">표시할 복지 서비스 정보가 없습니다.</div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardWelfareService
              v-for="service in welfareServices"
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
      </div>
    </section>

    <!-- 진행 중인 공연/전시 섹션 -->
    <section class="py-12 bg-gray-50 border-b border-gray-200">
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">진행 중인 공연/전시</h2>
          <NuxtLink to="/alljeju/exhibitions" class="text-sm text-blue-600 hover:text-blue-700 font-medium smooth-transition flex items-center">
            모두 보기
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </NuxtLink>
        </div>

        <ClientOnly>
          <div v-if="exhibitionsLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="exhibitionsError" class="toss-card p-4 border-red-200 bg-red-50">
            <div class="text-red-700 text-sm">공연/전시 정보를 불러오는 중 오류가 발생했습니다.</div>
          </div>

          <div v-else-if="!exhibitions.length" class="text-center py-12">
            <div class="text-gray-500">표시할 공연/전시 정보가 없습니다.</div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    </section>

    <!-- 최신 행사/축제 섹션 -->
    <section class="py-12 bg-white">
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">최신 행사/축제</h2>
          <NuxtLink to="/alljeju/festivals" class="text-sm text-blue-600 hover:text-blue-700 font-medium smooth-transition flex items-center">
            모두 보기
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </NuxtLink>
        </div>

        <ClientOnly>
          <div v-if="festivalsLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="festivalsError" class="toss-card p-4 border-red-200 bg-red-50">
            <div class="text-red-700 text-sm">행사/축제 정보를 불러오는 중 오류가 발생했습니다.</div>
          </div>

          <div v-else-if="!festivals.length" class="text-center py-12">
            <div class="text-gray-500">표시할 행사/축제 정보가 없습니다.</div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

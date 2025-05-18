<template>
  <div>
    <!-- 히어로 섹션 -->
    <section class="py-12 lg:py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-3xl lg:text-4xl font-bold mb-6">
            제주도의 다양한 정보를 한 곳에서 확인하세요
          </h1>
          <p class="text-lg lg:text-xl mb-8 text-indigo-100">
            복지 서비스, 행사/축제, 공연/전시 정보를 쉽고 빠르게 찾아보세요.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink 
              to="/welfare-services" 
              class="px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
            >
              복지 서비스 보기
            </NuxtLink>
            <NuxtLink 
              to="/festivals" 
              class="px-6 py-3 bg-indigo-700 text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors"
            >
              행사/축제 보기
            </NuxtLink>
            <NuxtLink 
              to="/exhibitions" 
              class="px-6 py-3 bg-indigo-700 text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors"
            >
              공연/전시 보기
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 최신 복지 서비스 섹션 -->
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">최신 복지 서비스</h2>
          <NuxtLink to="/welfare-services" class="text-indigo-600 hover:text-indigo-800 font-medium">
            모두 보기 &rarr;
          </NuxtLink>
        </div>
        
        <div v-if="welfareServicesLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        
        <div v-else-if="welfareServicesError" class="bg-red-50 text-red-700 p-4 rounded-lg">
          복지 서비스 정보를 불러오는 중 오류가 발생했습니다.
        </div>
        
        <div v-else-if="!welfareServices.length" class="text-center py-12 text-gray-500">
          표시할 복지 서비스 정보가 없습니다.
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardWelfareService 
            v-for="service in welfareServices" 
            :key="service.id" 
            :item="service" 
          />
        </div>
      </div>
    </section>
    
    <!-- 진행 중인 공연/전시 섹션 -->
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">진행 중인 공연/전시</h2>
          <NuxtLink to="/exhibitions" class="text-indigo-600 hover:text-indigo-800 font-medium">
            모두 보기 &rarr;
          </NuxtLink>
        </div>
        
        <div v-if="exhibitionsLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        
        <div v-else-if="exhibitionsError" class="bg-red-50 text-red-700 p-4 rounded-lg">
          공연/전시 정보를 불러오는 중 오류가 발생했습니다.
        </div>
        
        <div v-else-if="!exhibitions.length" class="text-center py-12 text-gray-500">
          표시할 공연/전시 정보가 없습니다.
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardExhibition 
            v-for="exhibition in exhibitions" 
            :key="exhibition.id" 
            :item="exhibition" 
          />
        </div>
      </div>
    </section>
    
    <!-- 최신 행사/축제 섹션 -->
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">최신 행사/축제</h2>
          <NuxtLink to="/festivals" class="text-indigo-600 hover:text-indigo-800 font-medium">
            모두 보기 &rarr;
          </NuxtLink>
        </div>
        
        <div v-if="festivalsLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        
        <div v-else-if="festivalsError" class="bg-red-50 text-red-700 p-4 rounded-lg">
          행사/축제 정보를 불러오는 중 오류가 발생했습니다.
        </div>
        
        <div v-else-if="!festivals.length" class="text-center py-12 text-gray-500">
          표시할 행사/축제 정보가 없습니다.
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardFestival 
            v-for="festival in festivals" 
            :key="festival.id" 
            :item="festival" 
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
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

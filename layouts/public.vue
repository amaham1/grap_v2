<template>
  <div class="min-h-screen flex flex-col bg-white relative">
    <!-- 헤더 -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center smooth-transition">
            <h1 class="text-lg font-medium text-gray-900">Grap</h1>
          </NuxtLink>

          <nav class="hidden md:flex space-x-6">
            <NuxtLink to="/alljeju" class="text-sm text-gray-600 hover:text-gray-900 smooth-transition">
              홈
            </NuxtLink>
            <NuxtLink to="/alljeju/welfare-services" class="text-sm text-gray-600 hover:text-gray-900 smooth-transition">
              복지 서비스
            </NuxtLink>
            <NuxtLink to="/alljeju/festivals" class="text-sm text-gray-600 hover:text-gray-900 smooth-transition">
              행사/축제
            </NuxtLink>
            <NuxtLink to="/alljeju/exhibitions" class="text-sm text-gray-600 hover:text-gray-900 smooth-transition">
              공연/전시
            </NuxtLink>
            <NuxtLink to="/alljeju/gas-stations" class="text-sm text-gray-600 hover:text-gray-900 smooth-transition">
              주유소
            </NuxtLink>
          </nav>

          <button class="md:hidden p-2 rounded-lg hover:bg-gray-100 smooth-transition" @click="isMobileMenuOpen = !isMobileMenuOpen">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>

        <!-- 모바일 메뉴 -->
        <div v-if="isMobileMenuOpen" class="md:hidden mt-3 pt-3 border-t border-gray-100">
          <div class="space-y-1">
            <NuxtLink to="/alljeju" class="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium smooth-transition">
              홈
            </NuxtLink>
            <NuxtLink to="/alljeju/welfare-services" class="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium smooth-transition">
              복지 서비스
            </NuxtLink>
            <NuxtLink to="/alljeju/festivals" class="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium smooth-transition">
              행사/축제
            </NuxtLink>
            <NuxtLink to="/alljeju/exhibitions" class="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium smooth-transition">
              공연/전시
            </NuxtLink>
            <NuxtLink to="/alljeju/gas-stations" class="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium smooth-transition">
              최저가 주유소
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="flex-grow">
      <slot />
    </main>

    <!-- 푸터 (주유소 페이지에서는 숨김) -->
    <footer v-if="!isGasStationsPage" class="bg-gray-50 border-t border-gray-100">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="text-base font-medium mb-3 text-gray-900">Grap</h3>
            <p class="text-sm text-gray-600 leading-relaxed">제주도의 복지 서비스, 행사/축제, 공연/전시 정보를 한눈에 볼 수 있는 서비스입니다.</p>
          </div>

          <div>
            <h3 class="text-base font-semibold mb-3 text-gray-900">서비스</h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/alljeju" class="text-sm text-gray-600 hover:text-blue-600 smooth-transition">홈</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/alljeju/welfare-services" class="text-sm text-gray-600 hover:text-blue-600 smooth-transition">복지 서비스</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/alljeju/festivals" class="text-sm text-gray-600 hover:text-blue-600 smooth-transition">행사/축제</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/alljeju/exhibitions" class="text-sm text-gray-600 hover:text-blue-600 smooth-transition">공연/전시</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/alljeju/gas-stations" class="text-sm text-gray-600 hover:text-blue-600 smooth-transition">최저가 주유소</NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="text-base font-semibold mb-3 text-gray-900">문의</h3>
            <div class="space-y-1">
              <p class="text-sm text-gray-600">이메일: 82grap@gmail.com</p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 mt-6 pt-6 text-center">
          <p class="text-sm text-gray-500">&copy; {{ new Date().getFullYear() }} Grap. All rights reserved.</p>
        </div>
      </div>
    </footer>



    <!-- 에러 표시 컴포넌트 -->
    <ErrorDisplay />
  </div>
</template>

<script setup lang="ts">
import ErrorDisplay from '~/components/common/ErrorDisplay.vue';

const isMobileMenuOpen = ref(false);
const route = useRoute();

// Canonical URL 설정
useHead({
  link: [
    {
      rel: 'canonical',
      href: `https://grap.co.kr${route.path}`
    }
  ]
});

// DB 연결 확인
const { checkConnectionOnMount } = useDbConnection();
checkConnectionOnMount();

// 주유소 페이지인지 확인
const isGasStationsPage = computed(() => {
  return route.path.includes('/gas-stations');
});





// 페이지 변경 시 모바일 메뉴 닫기
watch(() => useRoute().path, () => {
  isMobileMenuOpen.value = false;
});
</script>

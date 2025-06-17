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

            <!-- 편의 기능 드롭다운 메뉴 -->
            <div class="relative dropdown-container">
              <button
                @mouseenter="isUtilityMenuOpen = true"
                @click="isUtilityMenuOpen = !isUtilityMenuOpen"
                class="text-sm text-gray-600 hover:text-gray-900 smooth-transition flex items-center gap-1"
              >
                편의 기능
                <svg class="w-3 h-3 transition-transform duration-200" :class="{ 'rotate-180': isUtilityMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              <!-- 드롭다운 메뉴 -->
              <div
                v-if="isUtilityMenuOpen"
                @mouseenter="isUtilityMenuOpen = true"
                @mouseleave="handleDropdownLeave"
                class="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                <div class="py-1">
                  <NuxtLink
                    to="/alljeju/utilities/text-recognition"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 smooth-transition"
                    @click="isUtilityMenuOpen = false"
                  >
                    글자 인식
                  </NuxtLink>
                </div>
              </div>
            </div>
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

            <!-- 모바일 편의 기능 메뉴 -->
            <div class="border-t border-gray-100 mt-2 pt-2">
              <div class="text-xs text-gray-500 px-2 py-1 font-medium">편의 기능</div>
              <NuxtLink to="/alljeju/utilities/text-recognition" class="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium smooth-transition">
                글자 인식
              </NuxtLink>
            </div>
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
const isUtilityMenuOpen = ref(false);
const route = useRoute();

// 드롭다운 메뉴 타이머
let dropdownTimer: NodeJS.Timeout | null = null;

/**
 * 드롭다운 메뉴 leave 핸들러
 */
const handleDropdownLeave = (): void => {
  // 약간의 지연을 두어 사용자가 메뉴로 마우스를 이동할 시간을 줌
  dropdownTimer = setTimeout(() => {
    isUtilityMenuOpen.value = false;
  }, 150);
};

// 컴포넌트 언마운트 시 타이머 정리
onUnmounted(() => {
  if (dropdownTimer) {
    clearTimeout(dropdownTimer);
  }
});

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

// 헤더 높이 계산 및 CSS 변수 설정
onMounted(() => {
  const header = document.querySelector('header');
  if (header) {
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  }
});
</script>

<style>
/* 헤더 높이 CSS 변수 기본값 설정 */
:root {
  --header-height: 60px;
}
/* 드롭다운 메뉴 개선 */
.dropdown-container {
  position: relative;
}

.dropdown-container::before {
  content: '';
  position: absolute;
  top: 100%;
  left: -10px;
  right: -10px;
  height: 10px;
  background: transparent;
  z-index: 49;
}

.dropdown-container:hover .dropdown-menu,
.dropdown-container .dropdown-menu:hover {
  display: block;
}
</style>

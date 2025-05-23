<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
    <!-- 헤더 -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-gray-800 transition-all duration-300">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center group">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-all duration-300">
              <span class="text-white font-bold text-lg">JJ</span>
            </div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-teal-500 to-indigo-600 bg-clip-text text-transparent group-hover:from-teal-400 group-hover:to-indigo-500 transition-all duration-300">제주 지역정보</h1>
          </NuxtLink>

          <nav class="hidden md:flex space-x-1">
            <NuxtLink to="/alljeju" class="px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-800 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-all duration-200">
              홈
            </NuxtLink>
            <NuxtLink to="/alljeju/welfare-services" class="px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-800 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-all duration-200">
              복지 서비스
            </NuxtLink>
            <NuxtLink to="/alljeju/festivals" class="px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-800 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-all duration-200">
              행사/축제
            </NuxtLink>
            <NuxtLink to="/alljeju/exhibitions" class="px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-800 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-all duration-200">
              공연/전시
            </NuxtLink>
          </nav>

          <div class="flex items-center space-x-2">
            <button @click="toggleDarkMode" class="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
              <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <button class="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" @click="isMobileMenuOpen = !isMobileMenuOpen">
              <svg v-if="!isMobileMenuOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- 모바일 메뉴 -->
        <div v-if="isMobileMenuOpen" class="md:hidden mt-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-in-out">
          <NuxtLink to="/alljeju" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors duration-200">
            홈
          </NuxtLink>
          <NuxtLink to="/alljeju/welfare-services" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors duration-200">
            복지 서비스
          </NuxtLink>
          <NuxtLink to="/alljeju/festivals" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors duration-200">
            행사/축제
          </NuxtLink>
          <NuxtLink to="/alljeju/exhibitions" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors duration-200">
            공연/전시
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="flex-grow container mx-auto px-4 py-8 md:py-12">
      <slot />
    </main>

    <!-- 푸터 -->
    <footer class="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center mr-3">
                <span class="text-white font-bold text-lg">JJ</span>
              </div>
              <h3 class="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">제주 지역정보</h3>
            </div>
            <p class="text-gray-300 leading-relaxed">제주도의 복지 서비스, 행사/축제, 공연/전시 정보를 한눈에 볼 수 있는 서비스입니다.</p>
          </div>

          <div>
            <h3 class="text-lg font-semibold mb-4 text-teal-300">바로가기</h3>
            <ul class="space-y-3">
              <li>
                <NuxtLink to="/alljeju" class="text-gray-300 hover:text-teal-300 transition-colors duration-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  홈
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/alljeju/welfare-services" class="text-gray-300 hover:text-teal-300 transition-colors duration-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  복지 서비스
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/alljeju/festivals" class="text-gray-300 hover:text-teal-300 transition-colors duration-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                  </svg>
                  행사/축제
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/alljeju/exhibitions" class="text-gray-300 hover:text-teal-300 transition-colors duration-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  공연/전시
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="text-lg font-semibold mb-4 text-teal-300">연락처</h3>
            <div class="space-y-3">
              <p class="text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                제주특별자치도
              </p>
              <p class="text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                문의: 000-0000-0000
              </p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-700 mt-10 pt-8 text-center text-gray-400">
          <p class="text-sm">&copy; {{ new Date().getFullYear() }} 제주 지역정보. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const isMobileMenuOpen = ref(false);
const isDarkMode = ref(false);

// 페이지 로드 시 다크 모드 설정 확인
onMounted(() => {
  // 로컬 스토리지에서 다크 모드 설정 가져오기
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  } else {
    // 시스템 설정 확인
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDarkMode.value = true;
      document.documentElement.classList.add('dark');
    }
  }
});

// 다크 모드 토글 함수
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  }
}

// 페이지 변경 시 모바일 메뉴 닫기
watch(() => useRoute().path, () => {
  isMobileMenuOpen.value = false;
});
</script>

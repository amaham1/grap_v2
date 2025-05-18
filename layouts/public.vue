<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center">
            <h1 class="text-2xl font-bold text-indigo-700">제주 지역정보</h1>
          </NuxtLink>
          
          <nav class="hidden md:flex space-x-6">
            <NuxtLink to="/" class="text-gray-700 hover:text-indigo-700 font-medium">
              홈
            </NuxtLink>
            <NuxtLink to="/welfare-services" class="text-gray-700 hover:text-indigo-700 font-medium">
              복지 서비스
            </NuxtLink>
            <NuxtLink to="/festivals" class="text-gray-700 hover:text-indigo-700 font-medium">
              행사/축제
            </NuxtLink>
            <NuxtLink to="/exhibitions" class="text-gray-700 hover:text-indigo-700 font-medium">
              공연/전시
            </NuxtLink>
          </nav>
          
          <button class="md:hidden" @click="isMobileMenuOpen = !isMobileMenuOpen">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
        
        <!-- 모바일 메뉴 -->
        <div v-if="isMobileMenuOpen" class="md:hidden mt-4 space-y-2">
          <NuxtLink to="/" class="block py-2 text-gray-700 hover:text-indigo-700 font-medium">
            홈
          </NuxtLink>
          <NuxtLink to="/welfare-services" class="block py-2 text-gray-700 hover:text-indigo-700 font-medium">
            복지 서비스
          </NuxtLink>
          <NuxtLink to="/festivals" class="block py-2 text-gray-700 hover:text-indigo-700 font-medium">
            행사/축제
          </NuxtLink>
          <NuxtLink to="/exhibitions" class="block py-2 text-gray-700 hover:text-indigo-700 font-medium">
            공연/전시
          </NuxtLink>
        </div>
      </div>
    </header>
    
    <!-- 메인 콘텐츠 -->
    <main class="flex-grow container mx-auto px-4 py-8">
      <slot />
    </main>
    
    <!-- 푸터 -->
    <footer class="bg-gray-800 text-white">
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">제주 지역정보</h3>
            <p class="text-gray-300">제주도의 복지 서비스, 행사/축제, 공연/전시 정보를 한눈에 볼 수 있는 서비스입니다.</p>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-4">링크</h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/" class="text-gray-300 hover:text-white">홈</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/welfare-services" class="text-gray-300 hover:text-white">복지 서비스</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/festivals" class="text-gray-300 hover:text-white">행사/축제</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/exhibitions" class="text-gray-300 hover:text-white">공연/전시</NuxtLink>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-4">연락처</h3>
            <p class="text-gray-300">제주특별자치도</p>
            <p class="text-gray-300">문의: 000-0000-0000</p>
          </div>
        </div>
        
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {{ new Date().getFullYear() }} 제주 지역정보. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const isMobileMenuOpen = ref(false);

// 페이지 변경 시 모바일 메뉴 닫기
watch(() => useRoute().path, () => {
  isMobileMenuOpen.value = false;
});
</script>

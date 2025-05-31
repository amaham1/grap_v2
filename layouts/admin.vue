<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 text-white flex-shrink-0">
      <div class="p-4">
        <h1 class="text-2xl font-semibold">관리자 패널</h1>
      </div>
      <nav class="mt-4">
        <ul>
          <li>
            <NuxtLink to="/alljeju/admin" class="block px-4 py-2 hover:bg-gray-700">대시보드</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/content/festivals" class="block px-4 py-2 hover:bg-gray-700">축제 관리</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/content/exhibitions" class="block px-4 py-2 hover:bg-gray-700">전시회 관리</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/content/welfare-services" class="block px-4 py-2 hover:bg-gray-700">복지 서비스 관리</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/errors" class="block px-4 py-2 hover:bg-gray-700">오류 관리</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/api-logs" class="block px-4 py-2 hover:bg-gray-700">API 수집 로그</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/alljeju/admin/trigger-fetch" class="block px-4 py-2 hover:bg-gray-700">수동 데이터 수집</NuxtLink>
          </li>
          <!-- 추가 네비게이션 항목 -->
        </ul>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// DB 연결 확인
const { checkConnectionOnMount } = useDbConnection();
checkConnectionOnMount();

// Admin layout specific logic can go here
</script>

<style scoped>
.router-link-exact-active {
  @apply bg-gray-700 font-bold;
}
</style>

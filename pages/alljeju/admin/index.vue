<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">관리자 대시보드</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- 시스템 상태 카드 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-3 text-blue-600">시스템 상태</h3>
        <p class="text-sm text-gray-600 mb-4">전체 시스템의 상태를 확인합니다.</p>
        <div class="text-2xl font-bold text-green-600">정상</div>
      </div>

      <!-- 데이터 수집 상태 카드 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-3 text-purple-600">데이터 수집</h3>
        <p class="text-sm text-gray-600 mb-4">최근 데이터 수집 상태입니다.</p>
        <NuxtLink to="/alljeju/admin/trigger-fetch" class="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm">
          수동 수집 실행
        </NuxtLink>
      </div>

      <!-- 콘텐츠 관리 카드 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-3 text-teal-600">콘텐츠 관리</h3>
        <p class="text-sm text-gray-600 mb-4">축제, 전시회, 복지서비스 관리</p>
        <div class="space-y-2">
          <NuxtLink to="/admin/content/festivals" class="block text-sm text-teal-600 hover:text-teal-800">축제 관리</NuxtLink>
          <NuxtLink to="/admin/content/exhibitions" class="block text-sm text-teal-600 hover:text-teal-800">전시회 관리</NuxtLink>
        </div>
      </div>
    </div>

    <!-- 빠른 액션 -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-4">빠른 액션</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NuxtLink to="/alljeju/admin/trigger-fetch" class="bg-blue-500 text-white px-4 py-3 rounded text-center hover:bg-blue-600 transition-colors">
          데이터 수집
        </NuxtLink>
        <NuxtLink to="/admin/api-logs" class="bg-green-500 text-white px-4 py-3 rounded text-center hover:bg-green-600 transition-colors">
          API 로그
        </NuxtLink>
        <NuxtLink to="/admin/errors" class="bg-red-500 text-white px-4 py-3 rounded text-center hover:bg-red-600 transition-colors">
          오류 관리
        </NuxtLink>
        <button @click="logout" :disabled="isLoggingOut" class="bg-gray-500 text-white px-4 py-3 rounded hover:bg-gray-600 transition-colors disabled:bg-gray-400">
          {{ isLoggingOut ? '로그아웃 중...' : '로그아웃' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

const router = useRouter();
const isLoggingOut = ref(false);

const logout = async () => {
  isLoggingOut.value = true;
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    });
    await router.push('/alljeju/login');
  } catch (error: any) {
    console.error('로그아웃 실패:', error);
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<style scoped>
/* 페이지별 스타일 */
</style>
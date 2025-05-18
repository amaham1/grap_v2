<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">관리자 대시보드</h2>
    <p>이곳에서 시스템의 전반적인 상태를 확인하고 주요 기능에 접근할 수 있습니다.</p>
    <!-- Dashboard content goes here -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth-admin']
});
</script>

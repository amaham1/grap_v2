<template>
  <!-- 데스크톱 사이드 광고 (1280px 이상) -->
  <div class="hidden xl:block">
    <!-- 왼쪽 광고 -->
    <div class="absolute left-4 top-[200px] w-[150px] h-[500px] bg-gray-200 border border-gray-300 rounded-lg shadow-sm z-10">
      <div class="flex items-center justify-center h-full">
        <div class="text-center text-gray-500 text-sm">
          <div class="mb-2">광고</div>
          <div class="text-xs">150 x 500</div>
        </div>
      </div>
    </div>

    <!-- 오른쪽 광고 -->
    <div class="absolute right-4 top-[200px] w-[150px] h-[500px] bg-gray-200 border border-gray-300 rounded-lg shadow-sm z-10">
      <div class="flex items-center justify-center h-full">
        <div class="text-center text-gray-500 text-sm">
          <div class="mb-2">광고</div>
          <div class="text-xs">150 x 500</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 모바일/태블릿 하단 광고 (1280px 미만) -->
  <div class="xl:hidden mt-8">
    <div class="w-full h-[50px] bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
      <div class="text-center text-gray-500 text-sm">
        <span>광고 - 100% x 50px</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 광고 블록 컴포넌트
// 1280px 이상: 좌우 사이드에 150x500px 광고
// 1280px 미만: 하단에 100% width x 50px 광고
</script>

<style scoped>
/* 광고 블록 스타일 - absolute 포지션 사용으로 페이지 내 고정 위치 */
</style>

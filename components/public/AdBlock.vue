<template>
  <!-- 데스크톱 사이드 광고 (1280px 이상) -->
  <div class="hidden xl:block">
    <!-- 왼쪽 광고 -->
    <GoogleAdsense
      format="vertical"
      :width="160"
      :height="600"
      full-width-responsive="false"
      container-class="absolute left-4 top-[200px] w-[160px] h-[600px] z-10" />

    <!-- 오른쪽 광고 -->
    <GoogleAdsense
      format="vertical"
      :width="160"
      :height="600"
      full-width-responsive="false"
      container-class="absolute right-4 top-[200px] w-[160px] h-[600px] z-10" />
  </div>

  <!-- 모바일/태블릿 하단 광고 (1280px 미만) -->
  <div class="xl:hidden mt-8">
    <GoogleAdsense
      format="auto"
      full-width-responsive="true"
      container-class="w-full" />
  </div>
</template>

<script setup lang="ts">
import GoogleAdsense from './GoogleAdsense.vue';

// 광고 블록 컴포넌트
// 1280px 이상: 좌우 사이드에 세로형 광고
// 1280px 미만: 하단에 반응형 광고
</script>

<style scoped>
/* 광고 블록 스타일 - absolute 포지션 사용으로 페이지 내 고정 위치 */
</style>

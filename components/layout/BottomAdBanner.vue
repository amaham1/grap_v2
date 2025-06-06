<template>
  <div class="bottom-ad-banner">
    <!-- 모바일 광고 (768px 이하에서만 표시) -->
    <div v-if="isMobile" class="mobile-ad">
      <GoogleAdsense
        format="rectangle"
        width="320"
        height="50"
        full-width-responsive="false"
        container-class="mobile-ad-content" />
    </div>

    <!-- PC 광고 (768px 이상에서만 표시) -->
    <div v-if="!isMobile" class="desktop-ad">
      <GoogleAdsense
        format="rectangle"
        width="728"
        height="90"
        full-width-responsive="false"
        container-class="desktop-ad-content" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Google AdSense 컴포넌트 lazy loading
const GoogleAdsense = defineAsyncComponent(() => import('~/components/public/GoogleAdsense.vue'));

// 반응형 화면 크기 감지
const isMobile = ref(false);

// 화면 크기 확인 함수
const checkScreenSize = () => {
  if (import.meta.client) {
    isMobile.value = window.innerWidth < 768;
  }
};

// 클라이언트에서만 실행
onMounted(() => {
  if (import.meta.client) {
    // 초기 화면 크기 확인
    checkScreenSize();

    // 화면 크기 변경 감지
    window.addEventListener('resize', checkScreenSize);
  }
});

// 컴포넌트 언마운트 시 이벤트 리스너 제거
onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', checkScreenSize);
  }
});
</script>

<style scoped>
/* 하단 광고 배너 공통 스타일 */
.bottom-ad-banner {
  width: 100%;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin-top: auto; /* 푸터 역할을 하도록 */
}

/* 모바일 광고 스타일 (320x50) */
.mobile-ad {
  width: 100%;
  height: 66px; /* 50px 광고 + 16px 패딩 */
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  /* 모바일에서만 표시 보장 */
  visibility: visible;
}

.mobile-ad-content {
  width: 320px !important;
  height: 50px !important;
  min-width: 320px !important;
  min-height: 50px !important;
  max-width: 320px !important;
  max-height: 50px !important;
  display: block !important;
  overflow: hidden !important;
  box-sizing: border-box;
}

/* PC 광고 스타일 (728x90) */
.desktop-ad {
  width: 100%;
  height: 106px; /* 90px 광고 + 16px 패딩 */
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  /* PC에서만 표시 보장 */
  visibility: visible;
}

.desktop-ad-content {
  width: 728px !important;
  height: 90px !important;
  min-width: 728px !important;
  min-height: 90px !important;
  max-width: 728px !important;
  max-height: 90px !important;
  display: block !important;
  overflow: hidden !important;
  box-sizing: border-box;
}

/* AdSense 광고 요소 강제 크기 제한 */
.mobile-ad-content .adsbygoogle,
.desktop-ad-content .adsbygoogle {
  overflow: hidden !important;
  display: block !important;
  box-sizing: border-box;
}

.mobile-ad-content .adsbygoogle {
  width: 320px !important;
  height: 50px !important;
  min-width: 320px !important;
  min-height: 50px !important;
  max-width: 320px !important;
  max-height: 50px !important;
}

.desktop-ad-content .adsbygoogle {
  width: 728px !important;
  height: 90px !important;
  min-width: 728px !important;
  min-height: 90px !important;
  max-width: 728px !important;
  max-height: 90px !important;
}

/* AdSense가 동적으로 추가하는 iframe 크기 제한 */
.mobile-ad-content iframe {
  width: 320px !important;
  height: 50px !important;
  min-width: 320px !important;
  min-height: 50px !important;
  max-width: 320px !important;
  max-height: 50px !important;
  overflow: hidden !important;
  box-sizing: border-box;
}

.desktop-ad-content iframe {
  width: 728px !important;
  height: 90px !important;
  min-width: 728px !important;
  min-height: 90px !important;
  max-width: 728px !important;
  max-height: 90px !important;
  overflow: hidden !important;
  box-sizing: border-box;
}

/* 작은 화면에서 광고가 화면을 벗어나지 않도록 조정 */
@media (max-width: 360px) {
  .mobile-ad-content {
    width: 300px !important;
    min-width: 300px !important;
    max-width: 300px !important;
  }
  
  .mobile-ad-content .adsbygoogle,
  .mobile-ad-content iframe {
    width: 300px !important;
    min-width: 300px !important;
    max-width: 300px !important;
  }
}

/* 작은 데스크톱에서 광고가 화면을 벗어나지 않도록 조정 */
@media (min-width: 768px) and (max-width: 768px) {
  .desktop-ad-content {
    width: 468px !important;
    height: 60px !important;
    min-width: 468px !important;
    min-height: 60px !important;
    max-width: 468px !important;
    max-height: 60px !important;
  }
  
  .desktop-ad-content .adsbygoogle,
  .desktop-ad-content iframe {
    width: 468px !important;
    height: 60px !important;
    min-width: 468px !important;
    min-height: 60px !important;
    max-width: 468px !important;
    max-height: 60px !important;
  }
  
  .desktop-ad {
    height: 76px; /* 60px 광고 + 16px 패딩 */
  }
}
</style>

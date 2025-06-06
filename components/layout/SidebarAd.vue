<template>
  <!-- PC에서만 표시되는 사이드바 광고 -->
  <div v-if="!isMobile" class="sidebar-ad" :class="position">
    <GoogleAdsense
      format="vertical"
      width="160"
      height="600"
      full-width-responsive="false"
      container-class="sidebar-ad-content" />
  </div>
</template>

<script setup lang="ts">
// Props 정의
interface Props {
  position?: 'left' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
  position: 'left'
});

// Google AdSense 컴포넌트 lazy loading
const GoogleAdsense = defineAsyncComponent(() => import('~/components/public/GoogleAdsense.vue'));

// 반응형 화면 크기 감지
const isMobile = ref(false);

// 화면 크기 확인 함수
const checkScreenSize = () => {
  if (import.meta.client) {
    // 1280px 이상에서만 사이드바 광고 표시 (더 큰 화면에서만)
    isMobile.value = window.innerWidth < 1280;
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
/* 사이드바 광고 스타일 */
.sidebar-ad {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  width: 160px;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  visibility: visible;
}

/* 좌측 사이드바 광고 */
.sidebar-ad.left {
  left: 20px;
}

/* 우측 사이드바 광고 */
.sidebar-ad.right {
  right: 20px;
}

.sidebar-ad-content {
  width: 160px !important;
  height: 600px !important;
  min-width: 160px !important;
  min-height: 600px !important;
  max-width: 160px !important;
  max-height: 600px !important;
  display: block !important;
  overflow: hidden !important;
  box-sizing: border-box;
}

/* AdSense 광고 요소 강제 크기 제한 */
.sidebar-ad-content .adsbygoogle {
  width: 160px !important;
  height: 600px !important;
  min-width: 160px !important;
  min-height: 600px !important;
  max-width: 160px !important;
  max-height: 600px !important;
  overflow: hidden !important;
  display: block !important;
  box-sizing: border-box;
}

/* AdSense가 동적으로 추가하는 iframe 크기 제한 */
.sidebar-ad-content iframe {
  width: 160px !important;
  height: 600px !important;
  min-width: 160px !important;
  min-height: 600px !important;
  max-width: 160px !important;
  max-height: 600px !important;
  overflow: hidden !important;
  box-sizing: border-box;
}

/* 화면이 너무 작을 때 숨김 */
@media (max-width: 1279px) {
  .sidebar-ad {
    display: none !important;
    visibility: hidden !important;
  }
}

/* 화면 높이가 부족할 때 크기 조정 */
@media (max-height: 700px) {
  .sidebar-ad {
    height: 400px;
  }
  
  .sidebar-ad-content,
  .sidebar-ad-content .adsbygoogle,
  .sidebar-ad-content iframe {
    height: 400px !important;
    min-height: 400px !important;
    max-height: 400px !important;
  }
}
</style>

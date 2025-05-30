<template>
  <div :class="containerClass">
    <ins class="adsbygoogle"
         :style="adStyle"
         data-ad-client="ca-pub-6491895061878011"
         data-ad-slot="5895025788"
         :data-ad-format="adFormat"
         :data-full-width-responsive="fullWidthResponsive"></ins>
  </div>
</template>

<script setup lang="ts">
interface Props {
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle'
  width?: string | number
  height?: string | number
  fullWidthResponsive?: string
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  format: 'auto',
  fullWidthResponsive: 'true',
  containerClass: ''
});

// 광고 스타일 계산
const adStyle = computed(() => {
  let style = 'display:block;';
  
  if (props.width) {
    style += `width: ${typeof props.width === 'number' ? props.width + 'px' : props.width};`;
  }
  
  if (props.height) {
    style += `height: ${typeof props.height === 'number' ? props.height + 'px' : props.height};`;
  }
  
  return style;
});

// 광고 포맷
const adFormat = computed(() => {
  return props.format;
});

// 클라이언트 사이드에서만 애드센스 초기화
onMounted(() => {
  if (import.meta.client) {
    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 초기화
    nextTick(() => {
      const initializeAd = () => {
        try {
          const adsbygoogle = (window as any).adsbygoogle || [];
          
          // 현재 컴포넌트의 광고 요소만 찾기
          const adElement = document.querySelector('.adsbygoogle:not([data-adsbygoogle-status])');
          if (adElement) {
            adsbygoogle.push({});
          }
        } catch (error) {
          console.warn('AdSense initialization failed:', error);
        }
      };

      // 애드센스 스크립트가 이미 로드되었는지 확인
      if ((window as any).adsbygoogle) {
        initializeAd();
      } else {
        // 스크립트 로드를 기다림
        const checkAdSense = setInterval(() => {
          if ((window as any).adsbygoogle) {
            clearInterval(checkAdSense);
            initializeAd();
          }
        }, 100);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkAdSense);
        }, 10000);
      }
    });
  }
});
</script>

<style scoped>
.adsbygoogle {
  background: transparent;
}
</style>

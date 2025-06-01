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
            // 광고 초기화 전에 크기 제한 설정
            if (props.height) {
              (adElement as HTMLElement).style.height = typeof props.height === 'number' ? props.height + 'px' : props.height;
              (adElement as HTMLElement).style.maxHeight = typeof props.height === 'number' ? props.height + 'px' : props.height;
              (adElement as HTMLElement).style.minHeight = typeof props.height === 'number' ? props.height + 'px' : props.height;
              (adElement as HTMLElement).style.overflow = 'hidden';
            }

            adsbygoogle.push({});

            // 광고 로드 후 크기 재확인 및 강제 적용
            setTimeout(() => {
              enforceAdSize(adElement as HTMLElement);
            }, 1000);

            // 주기적으로 크기 확인 (AdSense가 동적으로 변경할 수 있음)
            const sizeCheckInterval = setInterval(() => {
              enforceAdSize(adElement as HTMLElement);
            }, 2000);

            // 10초 후 체크 중단
            setTimeout(() => {
              clearInterval(sizeCheckInterval);
            }, 10000);
          }
        } catch (error) {
          console.warn('AdSense initialization failed:', error);
        }
      };

      // 크기 강제 적용 함수
      const enforceAdSize = (element: HTMLElement) => {
        if (!element || !props.height) return;

        const targetHeight = typeof props.height === 'number' ? props.height + 'px' : props.height;

        // 광고 요소 자체 크기 제한
        element.style.height = targetHeight;
        element.style.maxHeight = targetHeight;
        element.style.minHeight = targetHeight;
        element.style.overflow = 'hidden';

        // iframe이 있다면 크기 제한
        const iframe = element.querySelector('iframe');
        if (iframe) {
          iframe.style.height = targetHeight;
          iframe.style.maxHeight = targetHeight;
          iframe.style.minHeight = targetHeight;
          iframe.style.overflow = 'hidden';
        }

        // 부모 컨테이너도 크기 제한
        const parent = element.parentElement;
        if (parent) {
          parent.style.height = targetHeight;
          parent.style.maxHeight = targetHeight;
          parent.style.overflow = 'hidden';
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
  overflow: hidden !important;
}

/* 강제 크기 제한 - 모든 하위 요소에 적용 */
.adsbygoogle,
.adsbygoogle * {
  box-sizing: border-box !important;
  overflow: hidden !important;
}

/* iframe 크기 제한 */
.adsbygoogle iframe {
  overflow: hidden !important;
  max-height: inherit !important;
}

/* 동적으로 추가되는 요소들 크기 제한 */
.adsbygoogle > div,
.adsbygoogle > ins {
  overflow: hidden !important;
  max-height: inherit !important;
}
</style>

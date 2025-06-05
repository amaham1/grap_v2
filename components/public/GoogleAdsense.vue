<template>
  <div :class="containerClass">
    <ins class="adsbygoogle"
         :style="adStyle"
         data-ad-client="ca-pub-6491895061878011"
         data-ad-slot="5895025788"
         :data-ad-format="adFormat"></ins>
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

// 광고 스타일 계산 - 고정 크기 광고에 대해 명시적 크기 설정
const adStyle = computed(() => {
  let style = 'display:block;';

  // 고정 크기 광고의 경우에만 크기 지정
  if (props.format === 'rectangle' || props.format === 'vertical') {
    if (props.width) {
      const width = typeof props.width === 'number' ? props.width + 'px' : props.width;
      style += `width: ${width}; min-width: ${width}; max-width: ${width};`;
    }

    if (props.height) {
      const height = typeof props.height === 'number' ? props.height + 'px' : props.height;
      style += `height: ${height}; min-height: ${height}; max-height: ${height};`;
    }

    style += 'overflow: hidden; box-sizing: border-box;';
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
    // 환경 확인
    const isProduction = window.location.hostname === 'grap.co.kr';
    const isDevelopment = window.location.hostname === 'localhost';

    // DOM이 완전히 렌더링된 후 초기화 (지연 시간 증가)
    nextTick(() => {
      // 지도 초기화 후 광고 로드를 위해 더 긴 지연 시간 적용
      setTimeout(() => {
        const initializeAd = () => {
          try {
            // AdSense 스크립트가 로드되었는지 확인
            if (!(window as any).adsbygoogle) {
              console.warn('❌ [ADSENSE] AdSense script not loaded');
              return;
            }

            const adsbygoogle = (window as any).adsbygoogle || [];

            // 현재 컴포넌트의 광고 요소만 찾기
            const adElement = document.querySelector('.adsbygoogle:not([data-adsbygoogle-status])');
            if (adElement) {
              console.log('✅ [ADSENSE] Initializing ad element', {
                format: props.format,
                width: props.width,
                height: props.height,
                fullWidthResponsive: props.fullWidthResponsive
              });

              // 고정 크기 광고의 경우에만 컨테이너 크기 설정
              if (props.format === 'rectangle' || props.format === 'vertical') {
                const container = adElement.parentElement;

                if (props.width && container) {
                  const width = typeof props.width === 'number' ? props.width + 'px' : props.width;
                  (container as HTMLElement).style.width = width;
                  (container as HTMLElement).style.minWidth = width;
                }

                if (props.height && container) {
                  const height = typeof props.height === 'number' ? props.height + 'px' : props.height;
                  (container as HTMLElement).style.height = height;
                  (container as HTMLElement).style.maxHeight = height;
                  (container as HTMLElement).style.minHeight = height;
                  (container as HTMLElement).style.overflow = 'hidden';
                }
              }

              // 광고 초기화
              adsbygoogle.push({});

              // 고정 크기 광고의 경우에만 크기 강제 적용
              if (props.format === 'rectangle' || props.format === 'vertical') {
                setTimeout(() => {
                  enforceAdSize(adElement as HTMLElement);
                }, 1000);

                // 주기적으로 크기 확인 (고정 크기 광고만)
                const sizeCheckInterval = setInterval(() => {
                  enforceAdSize(adElement as HTMLElement);
                }, 3000);

                // 10초 후 체크 중단
                setTimeout(() => {
                  clearInterval(sizeCheckInterval);
                }, 10000);
              }
            } else {
              console.warn('❌ [ADSENSE] Ad element not found');
            }
          } catch (error) {
            console.error('❌ [ADSENSE] Initialization failed:', error);
          }
        };

        // 크기 강제 적용 함수 (고정 크기 광고만)
        const enforceAdSize = (element: HTMLElement) => {
          if (!element || (props.format !== 'rectangle' && props.format !== 'vertical')) return;

          // 높이 설정
          if (props.height) {
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
          }

          // 너비 설정
          if (props.width) {
            const targetWidth = typeof props.width === 'number' ? props.width + 'px' : props.width;

            element.style.width = targetWidth;
            element.style.minWidth = targetWidth;

            // 부모 컨테이너도 너비 설정
            const parent = element.parentElement;
            if (parent) {
              parent.style.width = targetWidth;
              parent.style.minWidth = targetWidth;
            }
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
      }, 2000); // 2초 지연 후 초기화 시작 (지도 초기화 완료 후)
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

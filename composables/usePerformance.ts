// composables/usePerformance.ts
import { ref, computed, watch, nextTick } from 'vue';

// 성능 메트릭 타입
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// 메모리 사용량 정보
interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

export const usePerformance = () => {
  const metrics = ref<PerformanceMetric[]>([]);
  const isMonitoring = ref(false);

  // 성능 측정 시작
  const startMeasure = (name: string, metadata?: Record<string, any>): string => {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };
    
    metrics.value.push(metric);
    
    // Performance API 마크 생성
    if (typeof performance.mark === 'function') {
      performance.mark(`${name}-start`);
    }
    
    return name;
  };

  // 성능 측정 종료
  const endMeasure = (name: string): number | null => {
    const metric = metrics.value.find(m => m.name === name && !m.endTime);
    
    if (!metric) {
      console.warn(`Performance metric "${name}" not found or already ended`);
      return null;
    }
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    // Performance API 마크 및 측정 생성
    if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    
    console.log(`[Performance] ${name}: ${metric.duration.toFixed(2)}ms`, metric.metadata);
    
    return metric.duration;
  };

  // 함수 실행 시간 측정 래퍼
  const measureFunction = async <T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    startMeasure(name, metadata);
    
    try {
      const result = await fn();
      return result;
    } finally {
      endMeasure(name);
    }
  };

  // 컴포넌트 렌더링 시간 측정
  const measureRender = (componentName: string) => {
    const measureName = `render-${componentName}`;
    
    onBeforeMount(() => {
      startMeasure(measureName, { type: 'component-render', component: componentName });
    });
    
    onMounted(() => {
      nextTick(() => {
        endMeasure(measureName);
      });
    });
  };

  // 메모리 사용량 확인
  const getMemoryUsage = (): MemoryInfo | null => {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  };

  // 성능 통계 계산
  const getPerformanceStats = computed(() => {
    const completedMetrics = metrics.value.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return null;
    }
    
    const durations = completedMetrics.map(m => m.duration!);
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return {
      count: completedMetrics.length,
      total: total.toFixed(2),
      average: average.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      metrics: completedMetrics,
    };
  });

  // 성능 모니터링 시작/중지
  const startMonitoring = () => {
    isMonitoring.value = true;
    
    // 주기적으로 메모리 사용량 체크
    const memoryCheckInterval = setInterval(() => {
      if (!isMonitoring.value) {
        clearInterval(memoryCheckInterval);
        return;
      }
      
      const memory = getMemoryUsage();
      if (memory && memory.usedJSHeapSize) {
        // 메모리 사용량이 임계치를 넘으면 경고
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit!) * 100;
        if (usagePercent > 80) {
          console.warn(`[Performance] High memory usage: ${usagePercent.toFixed(1)}%`);
        }
      }
    }, 10000); // 10초마다 체크
  };

  const stopMonitoring = () => {
    isMonitoring.value = false;
  };

  // 메트릭 초기화
  const clearMetrics = () => {
    metrics.value = [];
    
    // Performance API 엔트리 정리
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks();
    }
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures();
    }
  };

  // 성능 보고서 생성
  const generateReport = () => {
    const stats = getPerformanceStats.value;
    const memory = getMemoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      stats,
      memory,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };
  };

  // 디바운스된 함수 생성
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // 스로틀된 함수 생성
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  };

  // 이미지 지연 로딩
  const lazyLoadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // 컴포넌트 지연 로딩 헬퍼
  const lazyComponent = (importFn: () => Promise<any>) => {
    return defineAsyncComponent({
      loader: importFn,
      loadingComponent: {
        template: '<div class="animate-pulse bg-gray-200 rounded h-20"></div>'
      },
      errorComponent: {
        template: '<div class="text-red-500 p-4">컴포넌트 로딩 실패</div>'
      },
      delay: 200,
      timeout: 10000,
    });
  };

  return {
    // 성능 측정
    startMeasure,
    endMeasure,
    measureFunction,
    measureRender,
    
    // 메모리 관리
    getMemoryUsage,
    
    // 모니터링
    startMonitoring,
    stopMonitoring,
    isMonitoring: readonly(isMonitoring),
    
    // 통계 및 보고서
    getPerformanceStats,
    generateReport,
    clearMetrics,
    
    // 유틸리티
    debounce,
    throttle,
    lazyLoadImage,
    lazyComponent,
    
    // 데이터
    metrics: readonly(metrics),
  };
};

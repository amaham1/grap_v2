// composables/useMemoization.ts
import { ref, computed, watch } from 'vue';

// 메모이제이션 캐시 타입
interface MemoCache<T> {
  [key: string]: {
    value: T;
    timestamp: number;
    hits: number;
  };
}

// 메모이제이션 옵션
interface MemoOptions {
  maxAge?: number; // 캐시 유효 시간 (ms)
  maxSize?: number; // 최대 캐시 크기
  keyGenerator?: (...args: any[]) => string; // 커스텀 키 생성 함수
}

export const useMemoization = () => {
  // 메모이제이션 함수 생성
  const memoize = <T extends (...args: any[]) => any>(
    fn: T,
    options: MemoOptions = {}
  ): T => {
    const {
      maxAge = 5 * 60 * 1000, // 기본 5분
      maxSize = 100,
      keyGenerator = (...args) => JSON.stringify(args)
    } = options;

    const cache: MemoCache<ReturnType<T>> = {};
    const cacheStats = ref({
      hits: 0,
      misses: 0,
      size: 0
    });

    const memoizedFn = ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator(...args);
      const now = Date.now();

      // 캐시에서 찾기
      if (cache[key]) {
        const cached = cache[key];
        
        // 유효 시간 확인
        if (now - cached.timestamp < maxAge) {
          cached.hits++;
          cacheStats.value.hits++;
          console.log(`[MEMO-HIT] ${fn.name || 'anonymous'}: ${key}`);
          return cached.value;
        } else {
          // 만료된 캐시 제거
          delete cache[key];
          cacheStats.value.size--;
        }
      }

      // 캐시 미스 - 함수 실행
      cacheStats.value.misses++;
      console.log(`[MEMO-MISS] ${fn.name || 'anonymous'}: ${key}`);
      
      const result = fn(...args);
      
      // 캐시 크기 제한 확인
      if (Object.keys(cache).length >= maxSize) {
        // LRU 방식으로 가장 오래된 항목 제거
        const oldestKey = Object.keys(cache).reduce((oldest, current) => 
          cache[current].timestamp < cache[oldest].timestamp ? current : oldest
        );
        delete cache[oldestKey];
        cacheStats.value.size--;
      }

      // 새 결과 캐시
      cache[key] = {
        value: result,
        timestamp: now,
        hits: 0
      };
      cacheStats.value.size++;

      return result;
    }) as T;

    // 캐시 관리 메서드 추가
    (memoizedFn as any).cache = {
      clear: () => {
        Object.keys(cache).forEach(key => delete cache[key]);
        cacheStats.value = { hits: 0, misses: 0, size: 0 };
      },
      delete: (key: string) => {
        if (cache[key]) {
          delete cache[key];
          cacheStats.value.size--;
        }
      },
      has: (key: string) => !!cache[key],
      size: () => Object.keys(cache).length,
      stats: () => ({ ...cacheStats.value }),
      entries: () => ({ ...cache })
    };

    return memoizedFn;
  };

  // 비동기 함수 메모이제이션
  const memoizeAsync = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: MemoOptions = {}
  ): T => {
    const {
      maxAge = 5 * 60 * 1000,
      maxSize = 50,
      keyGenerator = (...args) => JSON.stringify(args)
    } = options;

    const cache: MemoCache<Promise<Awaited<ReturnType<T>>>> = {};
    const pendingRequests: { [key: string]: Promise<any> } = {};

    const memoizedAsyncFn = (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      const key = keyGenerator(...args);
      const now = Date.now();

      // 진행 중인 요청이 있는지 확인
      if (pendingRequests[key]) {
        console.log(`[MEMO-PENDING] ${fn.name || 'anonymous'}: ${key}`);
        return pendingRequests[key];
      }

      // 캐시에서 찾기
      if (cache[key]) {
        const cached = cache[key];
        
        if (now - cached.timestamp < maxAge) {
          cached.hits++;
          console.log(`[MEMO-HIT-ASYNC] ${fn.name || 'anonymous'}: ${key}`);
          return cached.value;
        } else {
          delete cache[key];
        }
      }

      // 새 요청 시작
      console.log(`[MEMO-MISS-ASYNC] ${fn.name || 'anonymous'}: ${key}`);
      
      const promise = fn(...args);
      pendingRequests[key] = promise;

      try {
        const result = await promise;
        
        // 캐시 크기 제한
        if (Object.keys(cache).length >= maxSize) {
          const oldestKey = Object.keys(cache).reduce((oldest, current) => 
            cache[current].timestamp < cache[oldest].timestamp ? current : oldest
          );
          delete cache[oldestKey];
        }

        // 결과 캐시
        cache[key] = {
          value: Promise.resolve(result),
          timestamp: now,
          hits: 0
        };

        return result;
      } catch (error) {
        // 에러 발생 시 캐시하지 않음
        throw error;
      } finally {
        // 진행 중인 요청에서 제거
        delete pendingRequests[key];
      }
    }) as T;

    return memoizedAsyncFn;
  };

  // 컴포넌트별 메모이제이션
  const useMemoizedComputed = <T>(
    fn: () => T,
    deps: any[] = [],
    options: { maxAge?: number } = {}
  ) => {
    const { maxAge = 30000 } = options; // 기본 30초
    const cache = ref<{ value: T; timestamp: number } | null>(null);

    return computed(() => {
      const now = Date.now();
      
      // 캐시가 있고 유효한 경우
      if (cache.value && (now - cache.value.timestamp < maxAge)) {
        return cache.value.value;
      }

      // 새로 계산
      const result = fn();
      cache.value = {
        value: result,
        timestamp: now
      };

      return result;
    });
  };

  // 디바운스된 메모이제이션
  const useDebouncedMemo = <T>(
    fn: () => T,
    delay: number = 300
  ) => {
    const result = ref<T>();
    const timeoutId = ref<NodeJS.Timeout>();

    const debouncedFn = () => {
      if (timeoutId.value) {
        clearTimeout(timeoutId.value);
      }

      timeoutId.value = setTimeout(() => {
        result.value = fn();
      }, delay);
    };

    return {
      result: readonly(result),
      trigger: debouncedFn,
      cancel: () => {
        if (timeoutId.value) {
          clearTimeout(timeoutId.value);
        }
      }
    };
  };

  // 스로틀된 메모이제이션
  const useThrottledMemo = <T>(
    fn: () => T,
    delay: number = 1000
  ) => {
    const result = ref<T>();
    const lastCall = ref(0);

    const throttledFn = () => {
      const now = Date.now();
      
      if (now - lastCall.value >= delay) {
        lastCall.value = now;
        result.value = fn();
      }
    };

    return {
      result: readonly(result),
      trigger: throttledFn
    };
  };

  return {
    memoize,
    memoizeAsync,
    useMemoizedComputed,
    useDebouncedMemo,
    useThrottledMemo
  };
};

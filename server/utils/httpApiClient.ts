// server/utils/httpApiClient.ts
// 서버 사이드 전용 HTTP API 클라이언트 (Mixed Content 방지)

interface HttpApiOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * 서버 사이드 전용 HTTP API 호출 함수
 * 클라우드플레어 Mixed Content 정책을 우회하여 HTTP API 호출
 * 
 * @param url HTTP API URL
 * @param options 요청 옵션
 * @returns API 응답
 */
export async function callHttpApi<T = any>(
  url: string, 
  options: HttpApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 30000,
    retries = 2,
    headers = {}
  } = options;

  // 서버 사이드에서만 실행되는지 확인
  if (process.client) {
    throw new Error('HTTP API 호출은 서버 사이드에서만 가능합니다. Mixed Content 정책으로 인해 클라이언트에서는 차단됩니다.');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`[HTTP-API] ${url} 호출 시도 ${attempt}/${retries + 1}`);

      // AbortController를 사용한 타임아웃 처리
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Cloudflare-Workers/1.0 (Nuxt Server)',
          'Accept': 'application/json, text/plain, */*',
          'Cache-Control': 'no-cache',
          ...headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`[HTTP-API] ${url} 호출 성공 (시도 ${attempt})`);
      
      return {
        success: true,
        data,
        statusCode: response.status
      };

    } catch (error: any) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.warn(`[HTTP-API] ${url} 타임아웃 (${timeout}ms) - 시도 ${attempt}`);
      } else {
        console.error(`[HTTP-API] ${url} 호출 실패 - 시도 ${attempt}:`, error.message);
      }

      // 마지막 시도가 아니면 잠시 대기
      if (attempt < retries + 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    statusCode: 500
  };
}

/**
 * 제주도 API 전용 호출 함수
 * 제주도 API의 특성에 맞게 최적화
 */
export async function callJejuApi<T = any>(
  endpoint: string,
  apiKey?: string,
  options: HttpApiOptions = {}
): Promise<ApiResponse<T>> {
  let url = endpoint;
  
  // API 키가 있으면 쿼리 파라미터로 추가
  if (apiKey) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}code=${apiKey}`;
  }

  return callHttpApi<T>(url, {
    timeout: 45000, // 제주도 API는 응답이 느릴 수 있음
    retries: 3,
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      ...options.headers
    },
    ...options
  });
}

/**
 * 배치 API 호출 (여러 API를 동시에 호출)
 */
export async function callMultipleApis<T = any>(
  requests: Array<{ name: string; url: string; options?: HttpApiOptions }>
): Promise<Record<string, ApiResponse<T>>> {
  const results: Record<string, ApiResponse<T>> = {};

  const promises = requests.map(async (request) => {
    try {
      const result = await callHttpApi<T>(request.url, request.options);
      results[request.name] = result;
    } catch (error: any) {
      results[request.name] = {
        success: false,
        error: error.message
      };
    }
  });

  await Promise.allSettled(promises);
  return results;
}

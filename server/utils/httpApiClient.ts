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
      const requestStartTime = Date.now();
      console.log(`🌐 [HTTP-API] ${url} 호출 시도 ${attempt}/${retries + 1}`);
      console.log(`📤 [HTTP-API] 요청 헤더:`, {
        'User-Agent': 'Cloudflare-Workers/1.0 (Nuxt Server)',
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        ...headers
      });

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
      const requestDuration = Date.now() - requestStartTime;

      console.log(`📥 [HTTP-API] 응답 수신: ${response.status} ${response.statusText} (${requestDuration}ms)`);
      console.log(`📊 [HTTP-API] 응답 헤더:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const dataSize = JSON.stringify(data).length;

      console.log(`✅ [HTTP-API] ${url} 호출 성공 (시도 ${attempt}, ${requestDuration}ms)`);
      console.log(`📋 [HTTP-API] 응답 데이터 크기: ${dataSize} bytes`);

      // 데이터 구조 로깅 (주요 필드만)
      if (data && typeof data === 'object') {
        console.log(`🔍 [HTTP-API] 응답 데이터 구조:`, {
          keys: Object.keys(data),
          hasInfo: 'info' in data,
          infoLength: data.info ? data.info.length : 'N/A',
          sampleData: data.info && data.info.length > 0 ? data.info[0] : null
        });
      }

      return {
        success: true,
        data,
        statusCode: response.status,
        timing: {
          requestDuration,
          dataSize
        }
      };

    } catch (error: any) {
      lastError = error;
      const requestDuration = Date.now() - (Date.now() - timeout); // 대략적인 시간

      if (error.name === 'AbortError') {
        console.warn(`⏰ [HTTP-API] ${url} 타임아웃 (${timeout}ms) - 시도 ${attempt}`);
        console.warn(`🔄 [HTTP-API] 타임아웃 원인: 서버 응답 지연 또는 네트워크 문제`);
      } else {
        console.error(`❌ [HTTP-API] ${url} 호출 실패 - 시도 ${attempt}:`, {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack?.split('\n').slice(0, 3).join('\n'), // 스택 트레이스 일부만
          requestDuration: `${requestDuration}ms`
        });

        // 네트워크 관련 에러 상세 정보
        if (error.code) {
          console.error(`🌐 [HTTP-API] 네트워크 에러 코드: ${error.code}`);
        }
        if (error.errno) {
          console.error(`🔢 [HTTP-API] 시스템 에러 번호: ${error.errno}`);
        }
      }

      // 마지막 시도가 아니면 잠시 대기
      if (attempt < retries + 1) {
        const waitTime = 1000 * attempt;
        console.log(`⏳ [HTTP-API] ${waitTime}ms 대기 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
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

  console.log(`🏝️ [JEJU-API] 제주도 API 호출 시작`);
  console.log(`📍 [JEJU-API] 엔드포인트: ${endpoint}`);
  console.log(`🔑 [JEJU-API] API 키: ${apiKey ? `${apiKey.substring(0, 3)}***` : '없음'}`);
  console.log(`🌐 [JEJU-API] 최종 URL: ${url}`);
  console.log(`⚙️ [JEJU-API] 설정: 타임아웃 45초, 최대 3회 재시도`);

  const result = await callHttpApi<T>(url, {
    timeout: 45000, // 제주도 API는 응답이 느릴 수 있음
    retries: 3,
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      ...options.headers
    },
    ...options
  });

  if (result.success) {
    console.log(`✅ [JEJU-API] 제주도 API 호출 성공`);
    if (result.timing) {
      console.log(`⏱️ [JEJU-API] 응답 시간: ${result.timing.requestDuration}ms`);
      console.log(`📦 [JEJU-API] 데이터 크기: ${result.timing.dataSize} bytes`);
    }
  } else {
    console.error(`❌ [JEJU-API] 제주도 API 호출 실패: ${result.error}`);
    console.error(`🔧 [JEJU-API] 해결 방안:`);
    console.error(`  1. 네트워크 연결 상태 확인`);
    console.error(`  2. API 키 유효성 확인 (${apiKey})`);
    console.error(`  3. 제주도 API 서버 상태 확인`);
    console.error(`  4. 방화벽/프록시 설정 확인`);
  }

  return result;
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

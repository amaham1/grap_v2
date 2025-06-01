// composables/useErrorHandler.ts
import { useErrorStore } from '~/stores/error';

export const useErrorHandler = () => {
  const errorStore = useErrorStore();

  // 에러 처리 함수들
  const handleError = (error: unknown, context?: Record<string, any>) => {
    if (error instanceof Error) {
      // JavaScript 에러
      return errorStore.handleJavaScriptError(error, context);
    } else if (typeof error === 'string') {
      // 문자열 에러
      return errorStore.addSystemError(error, undefined, context);
    } else {
      // 기타 에러
      return errorStore.addSystemError(
        'Unknown error occurred',
        JSON.stringify(error),
        context
      );
    }
  };

  // API 에러 처리
  const handleApiError = (error: any, endpoint?: string) => {
    const context = {
      endpoint,
      timestamp: new Date().toISOString(),
    };

    if (error?.statusCode || error?.status) {
      const statusCode = error.statusCode || error.status;
      const message = error.statusMessage || error.message || 'API 요청 실패';
      
      if (statusCode >= 400 && statusCode < 500) {
        // 클라이언트 에러 (4xx)
        if (statusCode === 401 || statusCode === 403) {
          return errorStore.addAuthError(message, error.data?.message, context);
        } else if (statusCode === 422) {
          return errorStore.addValidationError(message, error.data?.message, context);
        } else {
          return errorStore.addUserError(message, error.data?.message, context);
        }
      } else if (statusCode >= 500) {
        // 서버 에러 (5xx)
        return errorStore.addSystemError(message, error.data?.message, context);
      }
    }

    // 네트워크 에러 또는 기타 에러
    if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return errorStore.addNetworkError(
        '네트워크 연결을 확인해주세요',
        error.message,
        context
      );
    }

    // 기본 시스템 에러
    return errorStore.addSystemError(
      error.message || 'API 요청 중 오류가 발생했습니다',
      error.stack,
      context
    );
  };

  // 비동기 함수 래퍼 (에러 자동 처리)
  const withErrorHandling = async <T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };

  // API 호출 래퍼
  const withApiErrorHandling = async <T>(
    apiFn: () => Promise<T>,
    endpoint?: string
  ): Promise<T | null> => {
    try {
      return await apiFn();
    } catch (error) {
      handleApiError(error, endpoint);
      return null;
    }
  };

  // 사용자 친화적 에러 메시지 표시
  const showUserError = (message: string, details?: string) => {
    return errorStore.addUserError(message, details);
  };

  // 성공 후 에러 해결
  const resolveErrorsOnSuccess = (context?: string) => {
    if (context) {
      // 특정 컨텍스트의 에러들만 해결
      errorStore.errors
        .filter(error => error.context?.endpoint === context || error.context?.action === context)
        .forEach(error => errorStore.resolveError(error.id));
    } else {
      // 재시도 가능한 에러들 해결
      errorStore.retryableErrors.forEach(error => errorStore.resolveError(error.id));
    }
  };

  // 에러 재시도
  const retryWithErrorHandling = async <T>(
    asyncFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: Record<string, any>
  ): Promise<T | null> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFn();
        
        // 성공 시 관련 에러들 해결
        resolveErrorsOnSuccess(context?.endpoint || context?.action);
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          // 최종 실패
          handleError(error, { ...context, attempts: attempt });
          break;
        }
        
        // 재시도 전 대기
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    return null;
  };

  // 전역 에러 핸들러 설정
  const setupGlobalErrorHandlers = () => {
    if (process.client) {
      // JavaScript 에러 핸들러
      window.addEventListener('error', (event) => {
        errorStore.handleJavaScriptError(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      // Promise rejection 핸들러
      window.addEventListener('unhandledrejection', (event) => {
        errorStore.handleUnhandledRejection(event.reason, {
          type: 'unhandledrejection',
        });
      });

      // 네트워크 상태 변경 감지
      window.addEventListener('online', () => {
        errorStore.resolveErrorsByType('network');
      });

      window.addEventListener('offline', () => {
        errorStore.addNetworkError(
          '인터넷 연결이 끊어졌습니다',
          '네트워크 연결을 확인해주세요'
        );
      });
    }
  };

  return {
    // 에러 처리 함수들
    handleError,
    handleApiError,
    showUserError,
    
    // 래퍼 함수들
    withErrorHandling,
    withApiErrorHandling,
    retryWithErrorHandling,
    
    // 유틸리티 함수들
    resolveErrorsOnSuccess,
    setupGlobalErrorHandlers,
    
    // 스토어 접근
    errorStore,
  };
};

// stores/error.ts
import { defineStore } from 'pinia';

export interface AppError {
  id: string;
  type: 'network' | 'validation' | 'auth' | 'system' | 'user';
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, any>;
  isResolved: boolean;
  retryable: boolean;
}

interface ErrorState {
  errors: AppError[];
  globalError: AppError | null;
  isShowingErrorModal: boolean;
  maxErrors: number;
}

export const useErrorStore = defineStore('error', {
  state: (): ErrorState => ({
    errors: [],
    globalError: null,
    isShowingErrorModal: false,
    maxErrors: 50, // 최대 에러 개수 제한
  }),

  getters: {
    // 해결되지 않은 에러들
    unresolvedErrors: (state) => state.errors.filter(error => !error.isResolved),
    
    // 최근 에러들 (최근 10개)
    recentErrors: (state) => state.errors.slice(-10).reverse(),
    
    // 에러 타입별 개수
    errorsByType: (state) => {
      const counts: Record<string, number> = {};
      state.errors.forEach(error => {
        counts[error.type] = (counts[error.type] || 0) + 1;
      });
      return counts;
    },
    
    // 재시도 가능한 에러들
    retryableErrors: (state) => state.errors.filter(error => error.retryable && !error.isResolved),
    
    // 에러 존재 여부
    hasErrors: (state) => state.errors.length > 0,
    hasUnresolvedErrors: (state) => state.unresolvedErrors.length > 0,
  },

  actions: {
    // 에러 추가
    addError(errorData: Omit<AppError, 'id' | 'timestamp' | 'isResolved'>) {
      const error: AppError = {
        ...errorData,
        id: this.generateErrorId(),
        timestamp: new Date(),
        isResolved: false,
      };

      // 에러 추가
      this.errors.push(error);

      // 최대 개수 초과 시 오래된 에러 제거
      if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(-this.maxErrors);
      }

      // 시스템 에러나 네트워크 에러는 전역 에러로 설정
      if (error.type === 'system' || error.type === 'network') {
        this.globalError = error;
      }

      // 콘솔에 에러 로그
      console.error(`[${error.type.toUpperCase()}] ${error.title}:`, error.message, error.details);

      return error.id;
    },

    // 네트워크 에러 추가
    addNetworkError(message: string, details?: string, context?: Record<string, any>) {
      return this.addError({
        type: 'network',
        title: '네트워크 오류',
        message,
        details,
        context,
        retryable: true,
      });
    },

    // 유효성 검사 에러 추가
    addValidationError(message: string, details?: string, context?: Record<string, any>) {
      return this.addError({
        type: 'validation',
        title: '입력 오류',
        message,
        details,
        context,
        retryable: false,
      });
    },

    // 인증 에러 추가
    addAuthError(message: string, details?: string, context?: Record<string, any>) {
      return this.addError({
        type: 'auth',
        title: '인증 오류',
        message,
        details,
        context,
        retryable: false,
      });
    },

    // 시스템 에러 추가
    addSystemError(message: string, details?: string, context?: Record<string, any>) {
      return this.addError({
        type: 'system',
        title: '시스템 오류',
        message,
        details,
        context,
        retryable: true,
      });
    },

    // 사용자 에러 추가 (사용자 실수로 인한 에러)
    addUserError(message: string, details?: string, context?: Record<string, any>) {
      return this.addError({
        type: 'user',
        title: '사용자 오류',
        message,
        details,
        context,
        retryable: false,
      });
    },

    // 에러 해결 처리
    resolveError(errorId: string) {
      const error = this.errors.find(e => e.id === errorId);
      if (error) {
        error.isResolved = true;
        
        // 전역 에러가 해결된 경우
        if (this.globalError?.id === errorId) {
          this.globalError = null;
        }
      }
    },

    // 모든 에러 해결
    resolveAllErrors() {
      this.errors.forEach(error => {
        error.isResolved = true;
      });
      this.globalError = null;
    },

    // 특정 타입의 에러들 해결
    resolveErrorsByType(type: AppError['type']) {
      this.errors
        .filter(error => error.type === type)
        .forEach(error => {
          error.isResolved = true;
        });
      
      // 전역 에러가 해당 타입인 경우
      if (this.globalError?.type === type) {
        this.globalError = null;
      }
    },

    // 에러 제거
    removeError(errorId: string) {
      const index = this.errors.findIndex(e => e.id === errorId);
      if (index !== -1) {
        this.errors.splice(index, 1);
        
        // 전역 에러가 제거된 경우
        if (this.globalError?.id === errorId) {
          this.globalError = null;
        }
      }
    },

    // 해결된 에러들 제거
    clearResolvedErrors() {
      this.errors = this.errors.filter(error => !error.isResolved);
    },

    // 모든 에러 제거
    clearAllErrors() {
      this.errors = [];
      this.globalError = null;
    },

    // 에러 모달 표시/숨김
    showErrorModal() {
      this.isShowingErrorModal = true;
    },

    hideErrorModal() {
      this.isShowingErrorModal = false;
    },

    // 전역 에러 설정
    setGlobalError(error: AppError | null) {
      this.globalError = error;
    },

    // 에러 ID 생성
    generateErrorId(): string {
      return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // JavaScript 에러 핸들러
    handleJavaScriptError(error: Error, context?: Record<string, any>) {
      return this.addSystemError(
        error.message,
        error.stack,
        {
          ...context,
          errorName: error.name,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        }
      );
    },

    // Promise rejection 핸들러
    handleUnhandledRejection(reason: any, context?: Record<string, any>) {
      const message = reason instanceof Error ? reason.message : String(reason);
      const details = reason instanceof Error ? reason.stack : undefined;
      
      return this.addSystemError(
        `Unhandled Promise Rejection: ${message}`,
        details,
        context
      );
    },
  },
});

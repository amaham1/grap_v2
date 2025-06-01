<template>
  <div v-if="errorStore.hasErrors" class="error-display">
    <!-- 전역 에러 모달 -->
    <div
      v-if="errorStore.globalError && errorStore.isShowingErrorModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click="errorStore.hideErrorModal()">
      <div
        class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        @click.stop>
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-gray-900">
              {{ errorStore.globalError.title }}
            </h3>
          </div>
        </div>
        
        <div class="mb-4">
          <p class="text-sm text-gray-700">
            {{ errorStore.globalError.message }}
          </p>
          <p v-if="errorStore.globalError.details" class="text-xs text-gray-500 mt-2">
            {{ errorStore.globalError.details }}
          </p>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            v-if="errorStore.globalError.retryable"
            @click="handleRetry"
            class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200">
            다시 시도
          </button>
          <button
            @click="handleResolve"
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
            확인
          </button>
        </div>
      </div>
    </div>

    <!-- 토스트 알림 (우상단) -->
    <div class="fixed top-4 right-4 z-40 space-y-2">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="error in recentUnresolvedErrors"
          :key="error.id"
          :class="[
            'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
            getErrorTypeClass(error.type)
          ]">
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <component :is="getErrorIcon(error.type)" class="w-5 h-5" />
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-gray-900">
                  {{ error.title }}
                </p>
                <p class="mt-1 text-sm text-gray-500">
                  {{ error.message }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="errorStore.resolveError(error.id)"
                  class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 에러 요약 버튼 (우하단) -->
    <div
      v-if="errorStore.unresolvedErrors.length > 3"
      class="fixed bottom-4 right-4 z-30">
      <button
        @click="showErrorSummary = !showErrorSummary"
        class="bg-red-500 text-white rounded-full p-3 shadow-lg hover:bg-red-600 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <span class="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {{ errorStore.unresolvedErrors.length }}
        </span>
      </button>
    </div>

    <!-- 에러 요약 패널 -->
    <div
      v-if="showErrorSummary"
      class="fixed bottom-20 right-4 z-30 bg-white rounded-lg shadow-xl border max-w-sm w-full max-h-96 overflow-hidden">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">에러 목록</h3>
          <button
            @click="showErrorSummary = false"
            class="text-gray-400 hover:text-gray-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="max-h-64 overflow-y-auto">
        <div
          v-for="error in errorStore.unresolvedErrors"
          :key="error.id"
          class="p-3 border-b border-gray-100 last:border-b-0">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ error.title }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ error.message }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ formatTime(error.timestamp) }}
              </p>
            </div>
            <button
              @click="errorStore.resolveError(error.id)"
              class="ml-2 text-gray-400 hover:text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div class="p-3 border-t bg-gray-50">
        <button
          @click="errorStore.resolveAllErrors()"
          class="w-full text-sm text-blue-600 hover:text-blue-800">
          모든 에러 해결
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useErrorStore } from '~/stores/error';

const errorStore = useErrorStore();
const showErrorSummary = ref(false);

// 최근 해결되지 않은 에러들 (최대 3개)
const recentUnresolvedErrors = computed(() => 
  errorStore.unresolvedErrors.slice(-3).reverse()
);

// 에러 타입별 스타일 클래스
const getErrorTypeClass = (type: string) => {
  const classes = {
    network: 'border-l-4 border-orange-400',
    validation: 'border-l-4 border-yellow-400',
    auth: 'border-l-4 border-red-400',
    system: 'border-l-4 border-red-500',
    user: 'border-l-4 border-blue-400',
  };
  return classes[type as keyof typeof classes] || 'border-l-4 border-gray-400';
};

// 에러 타입별 아이콘
const getErrorIcon = (type: string) => {
  const icons = {
    network: 'svg', // 네트워크 아이콘
    validation: 'svg', // 경고 아이콘
    auth: 'svg', // 잠금 아이콘
    system: 'svg', // 에러 아이콘
    user: 'svg', // 정보 아이콘
  };
  
  // 기본 에러 아이콘 반환
  return {
    template: `
      <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
    `
  };
};

// 시간 포맷팅
const formatTime = (timestamp: Date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp);
};

// 재시도 핸들러
const handleRetry = () => {
  if (errorStore.globalError) {
    errorStore.resolveError(errorStore.globalError.id);
    errorStore.hideErrorModal();
    
    // 여기서 실제 재시도 로직을 구현할 수 있습니다
    // 예: 마지막 실패한 액션을 다시 실행
  }
};

// 해결 핸들러
const handleResolve = () => {
  if (errorStore.globalError) {
    errorStore.resolveError(errorStore.globalError.id);
    errorStore.hideErrorModal();
  }
};

// 전역 에러가 있을 때 자동으로 모달 표시
watch(() => errorStore.globalError, (newError) => {
  if (newError && !errorStore.isShowingErrorModal) {
    errorStore.showErrorModal();
  }
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>

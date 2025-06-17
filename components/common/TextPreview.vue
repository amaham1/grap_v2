<template>
  <div class="text-preview">
    <!-- 미리보기 헤더 -->
    <div class="preview-header">
      <div class="header-content">
        <h3 class="preview-title">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          텍스트 미리보기
        </h3>
        
        <!-- 상태 표시 -->
        <div class="status-indicator">
          <div 
            v-if="isProcessing" 
            class="status-badge status-badge--processing"
          >
            <div class="processing-spinner"></div>
            인식 중
          </div>
          <div 
            v-else-if="hasText" 
            class="status-badge status-badge--complete"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            완료
          </div>
          <div 
            v-else 
            class="status-badge status-badge--waiting"
          >
            대기 중
          </div>
        </div>
      </div>
      
      <!-- 진행률 바 -->
      <div v-if="isProcessing && progress > 0" class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: `${progress}%`,
              backgroundColor: getProgressColor(progress)
            }"
          ></div>
        </div>
        <div class="progress-info">
          <span class="progress-text">{{ progress }}%</span>
          <span class="progress-stage">{{ getProgressStage(progress) }}</span>
        </div>
      </div>
    </div>

    <!-- 미리보기 내용 -->
    <div class="preview-content">
      <!-- 텍스트가 없을 때 -->
      <div v-if="!hasText && !isProcessing" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">인식 버튼을 눌러 텍스트를 인식해보세요</p>
      </div>

      <!-- 처리 중일 때 -->
      <div v-else-if="isProcessing && !previewText" class="loading-state">
        <div class="loading-animation">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        <p class="loading-text">이미지를 분석하고 있습니다...</p>
      </div>

      <!-- 미리보기 텍스트 -->
      <div v-else-if="previewText" class="text-content">
        <div class="text-display" :class="{ 'text-display--processing': isProcessing }">
          {{ previewText }}
        </div>
        
        <!-- 복사 버튼 (완료된 경우에만) -->
        <div v-if="!isProcessing && hasText" class="text-actions">
          <button 
            @click="copyText"
            class="copy-button"
            :class="{ 'copy-button--copied': isCopied }"
          >
            <svg v-if="!isCopied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ isCopied ? '복사됨' : '복사' }}
          </button>
        </div>
      </div>

      <!-- OCR 히스토리 -->
      <div v-if="ocrHistory && ocrHistory.length > 0" class="history-section">
        <div class="history-header">
          <h4 class="history-title">📚 인식 히스토리</h4>
          <span class="history-count">{{ ocrHistory.length }}개</span>
        </div>

        <div class="history-list">
          <div
            v-for="(item, index) in ocrHistory.slice().reverse()"
            :key="index"
            class="history-item"
          >
            <div class="history-item-header">
              <span class="history-timestamp">
                {{ formatTimestamp(item.timestamp) }}
              </span>
              <span class="history-confidence">
                신뢰도: {{ item.confidence }}%
              </span>
            </div>
            <div class="history-text">{{ item.text }}</div>
            <button
              @click="copyHistoryText(item.text)"
              class="history-copy-btn"
              title="복사"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  previewText: string;
  isProcessing: boolean;
  progress: number;
  ocrHistory?: Array<{
    text: string;
    confidence: number;
    timestamp: number;
  }>;
}

interface Emits {
  (e: 'copy', text: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 상태 관리
const isCopied = ref(false);

// 계산된 속성
const hasText = computed(() => props.previewText.trim().length > 0);

/**
 * 진행률에 따른 색상 반환
 */
const getProgressColor = (progress: number): string => {
  if (progress < 30) return '#ef4444'; // 빨간색 (초기화)
  if (progress < 60) return '#f59e0b'; // 주황색 (로딩)
  if (progress < 90) return '#3b82f6'; // 파란색 (처리 중)
  return '#10b981'; // 초록색 (완료)
};

/**
 * 진행률에 따른 단계 텍스트 반환
 */
const getProgressStage = (progress: number): string => {
  if (progress < 20) return '초기화 중';
  if (progress < 40) return '모델 로딩';
  if (progress < 70) return '언어 모델 준비';
  if (progress < 95) return '텍스트 인식';
  return '완료 중';
};

/**
 * 텍스트 복사
 */
const copyText = async (): Promise<void> => {
  if (!props.previewText.trim()) return;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 최신 Clipboard API 사용
      await navigator.clipboard.writeText(props.previewText);
    } else {
      // 폴백: 임시 텍스트 영역 사용
      const textArea = document.createElement('textarea');
      textArea.value = props.previewText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    isCopied.value = true;
    emit('copy', props.previewText);
    console.log('📋 [TEXT-PREVIEW] 텍스트 복사 완료');

    // 2초 후 복사 상태 초기화
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);

  } catch (err) {
    console.error('❌ [TEXT-PREVIEW] 텍스트 복사 실패:', err);
  }
};

/**
 * 히스토리 텍스트 복사
 */
const copyHistoryText = async (text: string): Promise<void> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    emit('copy', text);
    console.log('📋 [TEXT-PREVIEW] 히스토리 텍스트 복사 완료');
  } catch (err) {
    console.error('❌ [TEXT-PREVIEW] 히스토리 텍스트 복사 실패:', err);
  }
};

/**
 * 타임스탬프 포맷팅
 */
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// 텍스트 변경 시 복사 상태 초기화
watch(() => props.previewText, () => {
  isCopied.value = false;
});
</script>

<style scoped>
.text-preview {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge--processing {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-badge--complete {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge--waiting {
  background-color: #f3f4f6;
  color: #6b7280;
}

.processing-spinner {
  width: 0.75rem;
  height: 0.75rem;
  border: 1px solid transparent;
  border-top: 1px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 0.25rem;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 4rem;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  line-height: 1;
}

.progress-stage {
  font-size: 0.625rem;
  color: #6b7280;
  margin-top: 0.125rem;
  line-height: 1;
}

.preview-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.empty-state,
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 0.875rem;
  margin: 0;
}

.loading-animation {
  margin-bottom: 1rem;
}

.loading-dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  font-size: 0.875rem;
  margin: 0;
}

.text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.text-display {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  min-height: 3rem;
}

.text-display--processing {
  color: #6b7280;
  font-style: italic;
}

.text-actions {
  display: flex;
  justify-content: flex-end;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: #2563eb;
}

.copy-button--copied {
  background-color: #10b981;
}

.copy-button--copied:hover {
  background-color: #059669;
}

/* 히스토리 섹션 */
.history-section {
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
  padding-top: 1rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.history-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.history-count {
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* max-height 제거하여 모든 히스토리 표시 */
}

.history-item {
  position: relative;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.history-item:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-timestamp {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.history-confidence {
  font-size: 0.6875rem;
  color: #059669;
  background-color: #dcfce7;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.history-text {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: #374151;
  word-break: break-word;
  padding-right: 2rem;
}

.history-copy-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.history-copy-btn:hover {
  opacity: 1;
  background-color: #e5e7eb;
  transform: scale(1.1);
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .preview-header {
    padding: 0.5rem 0.75rem;
  }
  
  .header-content {
    margin-bottom: 0.375rem;
  }
  
  .preview-title {
    font-size: 0.8125rem;
  }
  
  .status-badge {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.375rem;
  }
  
  .preview-content {
    padding: 0.75rem;
  }
  
  .text-display {
    font-size: 0.8125rem;
    padding: 0.625rem;
  }
  
  .copy-button {
    font-size: 0.6875rem;
    padding: 0.375rem 0.625rem;
  }

  /* 모바일에서 히스토리 최적화 */
  .history-section {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .history-title {
    font-size: 0.8125rem;
  }

  .history-count {
    font-size: 0.6875rem;
  }

  /* 모바일에서도 모든 히스토리 표시 */

  .history-item {
    padding: 0.625rem;
  }

  .history-timestamp {
    font-size: 0.6875rem;
  }

  .history-confidence {
    font-size: 0.625rem;
  }

  .history-text {
    font-size: 0.75rem;
    padding-right: 1.75rem;
  }

  .history-copy-btn {
    top: 0.625rem;
    right: 0.625rem;
    font-size: 0.8125rem;
  }
}
</style>

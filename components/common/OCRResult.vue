<template>
  <div class="ocr-result">
    <!-- 결과가 없을 때 -->
    <div v-if="!hasResults" class="no-results">
      <div class="no-results-icon">📝</div>
      <p class="no-results-text">인식된 텍스트가 없습니다</p>
    </div>

    <!-- 결과가 있을 때 -->
    <div v-else class="results-container">
      <!-- 메인 텍스트 결과 -->
      <div v-if="mainResult" class="main-result">
        <div class="result-header">
          <h3 class="result-title">인식된 텍스트</h3>
          <div class="result-actions">
            <button 
              @click="copyToClipboard(mainResult.text)"
              class="action-button"
              :class="{ 'action-button--copied': copiedText === mainResult.text }"
            >
              <svg v-if="copiedText !== mainResult.text" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {{ copiedText === mainResult.text ? '복사됨' : '복사' }}
            </button>
          </div>
        </div>
        
        <div class="result-content">
          <div class="text-content" :class="{ 'text-content--selectable': isSelectable }">
            {{ mainResult.text }}
          </div>
          
          <div v-if="showConfidence && mainResult.confidence" class="confidence-badge">
            신뢰도: {{ Math.round(mainResult.confidence) }}%
          </div>
        </div>
      </div>

      <!-- 개별 텍스트 블록 결과 (옵션) -->
      <div v-if="showDetailedResults && detailedResults.length > 0" class="detailed-results">
        <div class="detailed-header">
          <h4 class="detailed-title">개별 텍스트 블록</h4>
          <button 
            @click="toggleDetailedView"
            class="toggle-button"
          >
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isDetailedViewOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
        
        <div v-if="isDetailedViewOpen" class="detailed-list">
          <div 
            v-for="(result, index) in detailedResults" 
            :key="index"
            class="detailed-item"
          >
            <div class="detailed-item-content">
              <span class="detailed-text">{{ result.text }}</span>
              <div class="detailed-meta">
                <span v-if="showConfidence && result.confidence" class="confidence-small">
                  {{ Math.round(result.confidence) }}%
                </span>
                <button 
                  @click="copyToClipboard(result.text)"
                  class="copy-small"
                  :class="{ 'copy-small--copied': copiedText === result.text }"
                >
                  <svg v-if="copiedText !== result.text" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 전체 복사 버튼 -->
      <div v-if="hasResults" class="copy-all-section">
        <button 
          @click="copyAllText"
          class="copy-all-button"
          :class="{ 'copy-all-button--copied': copiedText === 'ALL' }"
        >
          <svg v-if="copiedText !== 'ALL'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {{ copiedText === 'ALL' ? '전체 복사됨' : '전체 텍스트 복사' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OCRResult } from '~/types/global';

interface Props {
  results: OCRResult[];
  showConfidence?: boolean;
  showDetailedResults?: boolean;
  isSelectable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showConfidence: true,
  showDetailedResults: true,
  isSelectable: true
});

// 상태 관리
const copiedText = ref<string | null>(null);
const isDetailedViewOpen = ref(false);

// 계산된 속성
const hasResults = computed(() => props.results.length > 0);

const mainResult = computed(() => {
  // 가장 긴 텍스트를 메인 결과로 사용
  return props.results.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  }, props.results[0] || null);
});

const detailedResults = computed(() => {
  // 메인 결과를 제외한 나머지 결과들
  return props.results.filter(result => result !== mainResult.value);
});

/**
 * 클립보드에 텍스트 복사
 */
const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 최신 Clipboard API 사용
      await navigator.clipboard.writeText(text);
    } else {
      // 폴백: 임시 텍스트 영역 사용
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

    copiedText.value = text;
    console.log('📋 [OCR] 텍스트 복사 완료:', text.substring(0, 50) + '...');

    // 2초 후 복사 상태 초기화
    setTimeout(() => {
      copiedText.value = null;
    }, 2000);

  } catch (err) {
    console.error('❌ [OCR] 텍스트 복사 실패:', err);
    // 사용자에게 수동 복사 안내
    alert('텍스트 복사에 실패했습니다. 텍스트를 선택하여 수동으로 복사해주세요.');
  }
};

/**
 * 전체 텍스트 복사
 */
const copyAllText = async (): Promise<void> => {
  const allText = props.results
    .map(result => result.text)
    .filter(text => text.trim())
    .join('\n');
  
  if (allText) {
    copiedText.value = 'ALL';
    await copyToClipboard(allText);
  }
};

/**
 * 상세 결과 보기 토글
 */
const toggleDetailedView = (): void => {
  isDetailedViewOpen.value = !isDetailedViewOpen.value;
};

// 결과가 변경될 때 상세 보기 초기화
watch(() => props.results, () => {
  isDetailedViewOpen.value = false;
  copiedText.value = null;
});
</script>

<style scoped>
.ocr-result {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  color: #6b7280;
  text-align: center;
}

.no-results-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.no-results-text {
  font-size: 0.875rem;
}

.results-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.result-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #2563eb;
}

.action-button--copied {
  background-color: #10b981;
}

.result-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.text-content {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-content--selectable {
  user-select: text;
  cursor: text;
}

.confidence-badge {
  align-self: flex-start;
  padding: 0.25rem 0.5rem;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.detailed-results {
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.detailed-header {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
}

.detailed-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

.toggle-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background-color: #e5e7eb;
}

.detailed-list {
  max-height: 8rem;
  overflow-y: auto;
  border-top: 1px solid #e5e7eb;
}

.detailed-item {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.detailed-item:last-child {
  border-bottom: none;
}

.detailed-item-content {
  display: flex;
  justify-content: between;
  align-items: center;
  gap: 0.5rem;
}

.detailed-text {
  flex: 1;
  font-size: 0.75rem;
  color: #4b5563;
  word-break: break-word;
}

.detailed-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confidence-small {
  font-size: 0.625rem;
  color: #6b7280;
  background-color: #e5e7eb;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.copy-small {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.copy-small:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.copy-small--copied {
  color: #10b981;
}

.copy-all-section {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.copy-all-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #374151;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-all-button:hover {
  background-color: #1f2937;
}

.copy-all-button--copied {
  background-color: #10b981;
}
</style>

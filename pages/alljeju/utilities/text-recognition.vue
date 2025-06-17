<template>
  <div class="text-recognition-page">
    <!-- 모바일 헤더 공간 확보 -->
    <div class="header-spacer"></div>
    
    <!-- 메인 컨테이너 -->
    <div class="main-container">
      <!-- 카메라 영역 -->
      <div class="camera-section">
        <CameraCapture
          ref="cameraRef"
          :config="cameraConfig"
          :auto-start="false"
          @capture="handleCapture"
          @error="handleCameraError"
          @ready="handleCameraReady"
        />
      </div>

      <!-- 하단 컨트롤 영역 -->
      <div class="control-section">
        <!-- 인식 버튼과 결과 영역 -->
        <div class="control-row">
          <!-- 인식 버튼 -->
          <div class="recognize-button-container">
            <button
              @click="recognizeText"
              :disabled="!isCameraReady || isProcessing || isAutoRetrying"
              class="recognize-button"
              :class="{
                'recognize-button--processing': isProcessing || isAutoRetrying,
                'recognize-button--disabled': !isCameraReady
              }"
            >
              <div v-if="isProcessing || isAutoRetrying" class="button-spinner"></div>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <span v-if="isAutoRetrying">
                인식 중...
              </span>
              <span v-else>
                {{ isProcessing ? '인식 중...' : '인식' }}
              </span>
            </button>
            
            <!-- 진행률 표시 -->
            <div v-if="isProcessing && progress > 0" class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>

            <!-- 재시도 상태 표시 -->
            <div v-if="isAutoRetrying" class="retry-status">
              <div class="retry-info">
                <span class="retry-text">
                  🎯 목표 신뢰도 95% 달성까지 자동 재시도 중...
                </span>
                <span v-if="currentConfidence > 0" class="current-confidence">
                  현재 최고: {{ currentConfidence }}%
                </span>
              </div>
              <div class="retry-controls">
                <div class="retry-progress-info">
                  <span v-if="currentConfidence > 0" class="confidence-progress">
                    {{ currentConfidence }}% / 95%
                  </span>
                  <span v-else class="confidence-progress">
                    인식 중...
                  </span>
                </div>
                <button
                  @click="stopRetrying"
                  class="stop-retry-button"
                  title="현재까지의 최고 결과로 완료"
                >
                  ⏹️ 중단
                </button>
              </div>
            </div>
          </div>

          <!-- 미리보기 영역 -->
          <div class="preview-container">
            <TextPreview
              :preview-text="previewText"
              :is-processing="isProcessing"
              :progress="progress"
              :ocr-history="ocrHistory"
              @copy="handleTextCopy"
            />
          </div>
        </div>

        <!-- 오류 메시지 -->
        <div v-if="errorMessage" class="error-message">
          <div class="error-icon">⚠️</div>
          <p class="error-text">{{ errorMessage }}</p>
          <button @click="clearError" class="error-dismiss">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 도움말 -->
        <div v-if="showHelp" class="help-section">
          <div class="help-content">
            <h4 class="help-title">사용 방법</h4>
            <ul class="help-list">
              <li>카메라를 텍스트에 가까이 대세요</li>
              <li>텍스트가 선명하게 보이도록 조정하세요</li>
              <li>'인식' 버튼을 눌러 텍스트를 인식하세요</li>
              <li>인식된 텍스트를 터치하여 복사할 수 있습니다</li>
            </ul>
          </div>
          <button @click="showHelp = false" class="help-close">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 도움말 버튼 -->
    <button @click="showHelp = true" class="help-button">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { OCRResult, CameraConfig } from '~/types/global';
import CameraCapture from '~/components/common/CameraCapture.vue';
import OCRResultDisplay from '~/components/common/OCRResult.vue';
import TextPreview from '~/components/common/TextPreview.vue';

// 페이지 메타데이터
definePageMeta({
  layout: 'public',
  title: '글자 인식 - Grap',
  description: '스마트폰 카메라로 텍스트를 인식하고 복사할 수 있는 편리한 OCR 서비스입니다.'
});

// SEO 설정
useHead({
  title: '글자 인식 - Grap',
  meta: [
    { name: 'description', content: '스마트폰 카메라로 텍스트를 인식하고 복사할 수 있는 편리한 OCR 서비스입니다.' },
    { name: 'keywords', content: '글자 인식, OCR, 텍스트 인식, 카메라, 복사, 제주도' },
    { property: 'og:title', content: '글자 인식 - Grap' },
    { property: 'og:description', content: '스마트폰 카메라로 텍스트를 인식하고 복사할 수 있는 편리한 OCR 서비스입니다.' },
    { property: 'og:type', content: 'website' }
  ]
});

// Composables
const {
  recognizeFromCanvas,
  isProcessing,
  error: ocrError,
  progress,
  previewText,
  isPreviewMode,
  setPreviewMode,
  clearPreview
} = useOCR();

// 상태 관리
const cameraRef = ref<InstanceType<typeof CameraCapture>>();
const isCameraReady = ref(false);
const ocrResults = ref<OCRResult[]>([]);
const errorMessage = ref<string | null>(null);
const showHelp = ref(false);

// OCR 히스토리
const ocrHistory = ref<Array<{
  text: string;
  confidence: number;
  timestamp: number;
}>>([]);

// 자동 재시도 관련 상태
const isAutoRetrying = ref(false);
const retryCount = ref(0);
const currentConfidence = ref(0);
const targetConfidence = 95; // 목표 신뢰도
const shouldStopRetrying = ref(false); // 사용자 중단 플래그

// 카메라 설정 (OCR 최적화)
const cameraConfig: CameraConfig = {
  width: 1920,  // 고해상도로 텍스트 선명도 확보
  height: 1080,
  facingMode: 'environment', // 후면 카메라 사용 (문서 촬영에 적합)
  quality: 0.95 // 높은 품질로 텍스트 디테일 보존
};

/**
 * 카메라 준비 완료 핸들러
 */
const handleCameraReady = (): void => {
  isCameraReady.value = true;
  errorMessage.value = null;
  console.log('📷 [TEXT-RECOGNITION] 카메라 준비 완료');
};

/**
 * 카메라 오류 핸들러
 */
const handleCameraError = (error: string): void => {
  isCameraReady.value = false;
  errorMessage.value = `카메라 오류: ${error}`;
  console.error('❌ [TEXT-RECOGNITION] 카메라 오류:', error);
};

/**
 * 카메라 캡처 핸들러
 */
const handleCapture = (canvas: HTMLCanvasElement): void => {
  console.log('📸 [TEXT-RECOGNITION] 이미지 캡처됨');
  // 캡처는 recognizeText에서 직접 처리
};

/**
 * 단일 OCR 시도
 */
const performSingleOCR = async (): Promise<{ success: boolean; confidence: number; result?: any }> => {
  if (!cameraRef.value) {
    throw new Error('카메라가 준비되지 않았습니다.');
  }

  // 카메라에서 OCR 프레임 영역 즉시 캡처
  const canvas = cameraRef.value.captureImage();
  if (!canvas) {
    throw new Error('이미지 캡처에 실패했습니다.');
  }

  // OCR 실행
  const result = await recognizeFromCanvas(canvas);

  if (result.success && result.results.length > 0) {
    // 가장 신뢰도 높은 결과 찾기
    const bestResult = result.results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return {
      success: true,
      confidence: bestResult.confidence,
      result: { ocrResult: result, bestResult }
    };
  }

  return { success: false, confidence: 0 };
};

/**
 * 텍스트 인식 실행 (자동 재시도 포함)
 */
const recognizeText = async (): Promise<void> => {
  if (!cameraRef.value || !isCameraReady.value) {
    errorMessage.value = '카메라가 준비되지 않았습니다.';
    return;
  }

  try {
    errorMessage.value = null;
    ocrResults.value = [];
    isAutoRetrying.value = true;
    retryCount.value = 0;
    currentConfidence.value = 0;
    shouldStopRetrying.value = false;

    console.log('🔍 [TEXT-RECOGNITION] 자동 재시도 OCR 시작 (목표: 95% 이상, 무제한 재시도)');

    let bestOverallResult: any = null;
    let highestConfidence = 0;

    // 목표 신뢰도 달성하거나 사용자가 중단할 때까지 무제한 재시도
    while (!shouldStopRetrying.value) {
      retryCount.value++;

      try {
        const attemptResult = await performSingleOCR();

        if (attemptResult.success) {
          currentConfidence.value = attemptResult.confidence;

          // 지금까지 가장 좋은 결과 저장
          if (attemptResult.confidence > highestConfidence) {
            highestConfidence = attemptResult.confidence;
            bestOverallResult = attemptResult.result;
          }

          console.log(`📊 [TEXT-RECOGNITION] 신뢰도 ${attemptResult.confidence}%`);

          // 목표 신뢰도 달성 시 종료
          if (attemptResult.confidence >= targetConfidence) {
            console.log(`✅ [TEXT-RECOGNITION] 목표 신뢰도 달성! (${attemptResult.confidence}%)`);
            break;
          }
        } else {
          console.log(`⚠️ [TEXT-RECOGNITION] 텍스트 인식 실패`);
        }

        // 재시도 간격 (0.5초) - 사용자 중단 체크
        if (!shouldStopRetrying.value) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (attemptError) {
        console.error(`❌ [TEXT-RECOGNITION] OCR 시도 오류:`, attemptError);

        // 오류 발생 시에도 재시도 간격
        if (!shouldStopRetrying.value) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // 결과 처리
    if (bestOverallResult) {
      const { ocrResult, bestResult } = bestOverallResult;
      ocrResults.value = ocrResult.results;
      currentConfidence.value = bestResult.confidence;

      // 히스토리에 추가
      if (bestResult.text.trim()) {
        ocrHistory.value.push({
          text: bestResult.text.trim(),
          confidence: bestResult.confidence,
          timestamp: Date.now()
        });

        // 히스토리 최대 20개로 제한
        if (ocrHistory.value.length > 20) {
          ocrHistory.value = ocrHistory.value.slice(-20);
        }
      }

      console.log('✅ [TEXT-RECOGNITION] 최종 결과:', {
        최종신뢰도: bestResult.confidence,
        인식텍스트: bestResult.text,
        목표달성: bestResult.confidence >= targetConfidence ? '성공' : '사용자중단',
        중단여부: shouldStopRetrying.value
      });

      // 결과에 따른 메시지
      if (bestResult.confidence >= targetConfidence) {
        // 목표 달성
        console.log(`🎯 [TEXT-RECOGNITION] 목표 신뢰도 달성!`);
      } else if (shouldStopRetrying.value) {
        // 사용자 중단
        errorMessage.value = `사용자 중단 (최고 신뢰도: ${bestResult.confidence}%)`;
      } else {
        // 기타 종료 (일반적으로 발생하지 않음)
        errorMessage.value = `인식 완료 (최고 신뢰도: ${bestResult.confidence}%)`;
      }
    } else {
      if (shouldStopRetrying.value) {
        errorMessage.value = `사용자가 중단했습니다.`;
      } else {
        errorMessage.value = `텍스트를 인식할 수 없습니다.`;
      }
      console.warn('⚠️ [TEXT-RECOGNITION] 인식 결과 없음');
    }

  } catch (err) {
    const error = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    errorMessage.value = error;
    console.error('❌ [TEXT-RECOGNITION] 텍스트 인식 실패:', err);
  } finally {
    isAutoRetrying.value = false;
  }
};

/**
 * 재시도 중단
 */
const stopRetrying = (): void => {
  shouldStopRetrying.value = true;
  console.log('🛑 [TEXT-RECOGNITION] 사용자가 재시도를 중단했습니다.');
};

/**
 * 오류 메시지 제거
 */
const clearError = (): void => {
  errorMessage.value = null;
};

/**
 * 텍스트 복사 핸들러
 */
const handleTextCopy = (text: string): void => {
  console.log('📋 [TEXT-RECOGNITION] 텍스트 복사됨:', text.substring(0, 50) + '...');
};

// OCR 오류 감시
watch(ocrError, (newError) => {
  if (newError) {
    errorMessage.value = newError;
  }
});

// 페이지 진입 시 도움말 표시 (첫 방문자용)
onMounted(() => {
  const hasVisited = localStorage.getItem('text-recognition-visited');
  if (!hasVisited) {
    showHelp.value = true;
    localStorage.setItem('text-recognition-visited', 'true');
  }
});
</script>

<style scoped>
.text-recognition-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
}

.header-spacer {
  height: var(--header-height, 60px);
  background-color: transparent;
}

.main-container {
  height: calc(100vh - var(--header-height, 60px));
  display: flex;
  flex-direction: column;
}

.camera-section {
  flex: 1;
  position: relative;
  min-height: 0;
}

.control-section {
  background-color: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.recognize-button-container {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recognize-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 7rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.recognize-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.recognize-button:hover:not(:disabled)::before {
  left: 100%;
}

.recognize-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.recognize-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.recognize-button--processing {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  cursor: not-allowed;
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2);
}

.recognize-button--disabled {
  background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.button-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  height: 0.375rem;
  background-color: #e5e7eb;
  border-radius: 0.1875rem;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  transition: width 0.4s ease;
  border-radius: 0.1875rem;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 재시도 상태 표시 */
.retry-status {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

.retry-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.retry-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #92400e;
}

.current-confidence {
  font-size: 0.75rem;
  font-weight: 700;
  color: #059669;
  background-color: #dcfce7;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.retry-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.retry-progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.retry-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
}

.confidence-progress {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #059669;
}

.stop-retry-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.stop-retry-button:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.stop-retry-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(239, 68, 68, 0.2);
}

.preview-container {
  flex: 1;
  min-height: 6rem;
  max-height: 10rem;
  overflow: hidden;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%);
  border: 1px solid #fca5a5;
  border-radius: 0.75rem;
  color: #dc2626;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.error-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
}

.error-dismiss {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-dismiss:hover {
  background-color: #fca5a5;
  transform: scale(1.1);
}

.help-section {
  position: relative;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #93c5fd;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  animation: slideIn 0.3s ease-out;
}

.help-content {
  padding-right: 2.5rem;
}

.help-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.help-title::before {
  content: '💡';
  font-size: 1.125rem;
}

.help-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #1e40af;
}

.help-list li {
  font-size: 0.8125rem;
  margin-bottom: 0.375rem;
  line-height: 1.4;
  position: relative;
}

.help-list li::marker {
  color: #3b82f6;
}

.help-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  color: #1e40af;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.help-close:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.help-button {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
  z-index: 50;
  position: relative;
  overflow: hidden;
}

.help-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.help-button:hover::before {
  opacity: 1;
}

.help-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: scale(1.15);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
}

.help-button:active {
  transform: scale(1.05);
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .header-spacer {
    height: var(--header-height, 56px); /* 모바일에서 헤더 높이 조정 */
  }

  .main-container {
    height: calc(100vh - var(--header-height, 56px));
  }

  .control-section {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .control-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .recognize-button-container {
    align-self: stretch;
  }

  .recognize-button {
    width: 100%;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
  }

  .progress-bar {
    height: 0.375rem;
  }

  .preview-container {
    max-height: 10rem;
    min-height: 8rem;
  }

  .error-message {
    padding: 0.625rem;
    font-size: 0.8125rem;
  }

  .help-section {
    padding: 0.75rem;
  }

  .help-title {
    font-size: 0.8125rem;
  }

  .help-list li {
    font-size: 0.6875rem;
  }

  .help-button {
    width: 2.75rem;
    height: 2.75rem;
    bottom: 0.75rem;
    right: 0.75rem;
  }

  /* 모바일에서 재시도 상태 최적화 */
  .retry-status {
    margin-top: 0.5rem;
    padding: 0.625rem;
  }

  .retry-text {
    font-size: 0.75rem;
  }

  .current-confidence {
    font-size: 0.6875rem;
  }

  .retry-count {
    font-size: 0.6875rem;
  }

  .confidence-progress {
    font-size: 0.625rem;
  }

  .stop-retry-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }
}

/* 작은 모바일 화면 (iPhone SE 등) */
@media (max-width: 375px) {
  .control-section {
    padding: 0.5rem;
  }

  .recognize-button {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .preview-container {
    max-height: 7rem;
    min-height: 6rem;
  }

  .help-button {
    width: 2.5rem;
    height: 2.5rem;
  }
}

/* 가로 모드 최적화 */
@media (max-width: 768px) and (orientation: landscape) {
  .main-container {
    flex-direction: row;
  }

  .camera-section {
    flex: 1.5;
  }

  .control-section {
    flex: 1;
    max-width: 320px;
    border-top: none;
    border-left: 1px solid #e5e7eb;
    overflow-y: auto;
  }

  .control-row {
    flex-direction: column;
    height: 100%;
  }

  .preview-container {
    flex: 1;
    max-height: none;
    min-height: 0;
  }
}
</style>

<template>
  <div class="camera-container">
    <!-- 카메라 비디오 스트림 -->
    <video
      ref="videoRef"
      :class="[
        'camera-video',
        { 'camera-video--hidden': !isStreamActive }
      ]"
      autoplay
      playsinline
      muted
    ></video>

    <!-- 캡처용 캔버스 (숨김) -->
    <canvas
      ref="canvasRef"
      class="camera-canvas"
      style="display: none;"
    ></canvas>

    <!-- 카메라 로딩 상태 -->
    <div v-if="isLoading" class="camera-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">카메라를 준비하고 있습니다...</p>
    </div>

    <!-- 카메라 오류 상태 -->
    <div v-if="error" class="camera-error">
      <div class="error-icon">📷</div>
      <p class="error-text">{{ error }}</p>
      <button @click="initializeCamera" class="retry-button">
        다시 시도
      </button>
    </div>

    <!-- 카메라 비활성 상태 -->
    <div v-if="!isStreamActive && !isLoading && !error" class="camera-inactive">
      <div class="inactive-icon">📱</div>
      <p class="inactive-text">카메라를 시작하려면 버튼을 눌러주세요</p>
      <button @click="initializeCamera" class="start-button">
        카메라 시작
      </button>
    </div>

    <!-- OCR 인식 영역 오버레이 -->
    <div v-if="isStreamActive" class="ocr-overlay">
      <div class="ocr-frame">
        <div class="ocr-frame-border ocr-frame-border--top"></div>
        <div class="ocr-frame-border ocr-frame-border--right"></div>
        <div class="ocr-frame-border ocr-frame-border--bottom"></div>
        <div class="ocr-frame-border ocr-frame-border--left"></div>

        <div class="ocr-frame-corner ocr-frame-corner--top-left"></div>
        <div class="ocr-frame-corner ocr-frame-corner--top-right"></div>
        <div class="ocr-frame-corner ocr-frame-corner--bottom-left"></div>
        <div class="ocr-frame-corner ocr-frame-corner--bottom-right"></div>

        <div class="ocr-frame-label">
          <span class="ocr-frame-text">📄 텍스트를 이 영역에 맞춰주세요</span>
        </div>
      </div>
    </div>

    <!-- 카메라 컨트롤 -->
    <div v-if="isStreamActive" class="camera-controls">
      <button @click="switchCamera" class="control-button" :disabled="!canSwitchCamera">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </button>
      
      <button @click="stopCamera" class="control-button control-button--stop">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CameraConfig } from '~/types/global';

interface Props {
  config?: Partial<CameraConfig>;
  autoStart?: boolean;
}

interface Emits {
  (e: 'capture', canvas: HTMLCanvasElement): void;
  (e: 'error', error: string): void;
  (e: 'ready'): void;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  autoStart: false
});

const emit = defineEmits<Emits>();

// 기본 카메라 설정
const defaultConfig: CameraConfig = {
  width: 1280,
  height: 720,
  facingMode: 'environment', // 후면 카메라 기본
  quality: 0.9
};

// 상태 관리
const isLoading = ref(false);
const isStreamActive = ref(false);
const error = ref<string | null>(null);
const canSwitchCamera = ref(false);
const currentFacingMode = ref<'user' | 'environment'>('environment');

// DOM 참조
const videoRef = ref<HTMLVideoElement>();
const canvasRef = ref<HTMLCanvasElement>();

// 미디어 스트림
let mediaStream: MediaStream | null = null;

// 최종 설정
const finalConfig = computed(() => ({
  ...defaultConfig,
  ...props.config
}));

/**
 * 카메라 초기화
 */
const initializeCamera = async (): Promise<void> => {
  try {
    isLoading.value = true;
    error.value = null;

    // 기존 스트림 정리
    if (mediaStream) {
      stopCamera();
    }

    console.log('📷 [CAMERA] 카메라 초기화 시작...');

    // 미디어 장치 권한 확인
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('이 브라우저는 카메라를 지원하지 않습니다.');
    }

    // 카메라 스트림 요청
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: finalConfig.value.width },
        height: { ideal: finalConfig.value.height },
        facingMode: { ideal: currentFacingMode.value }
      },
      audio: false
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (!videoRef.value) {
      throw new Error('비디오 엘리먼트를 찾을 수 없습니다.');
    }

    // 비디오 스트림 연결
    videoRef.value.srcObject = mediaStream;
    
    // 비디오 로드 대기
    await new Promise<void>((resolve, reject) => {
      if (!videoRef.value) {
        reject(new Error('비디오 엘리먼트가 없습니다.'));
        return;
      }

      videoRef.value.onloadedmetadata = () => {
        resolve();
      };

      videoRef.value.onerror = () => {
        reject(new Error('비디오 로드 실패'));
      };
    });

    // 카메라 전환 가능 여부 확인
    await checkCameraSwitchCapability();

    isStreamActive.value = true;
    console.log('✅ [CAMERA] 카메라 초기화 완료');
    emit('ready');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '카메라 초기화 실패';
    error.value = errorMessage;
    console.error('❌ [CAMERA] 카메라 초기화 실패:', err);
    emit('error', errorMessage);
  } finally {
    isLoading.value = false;
  }
};

/**
 * 카메라 전환 가능 여부 확인
 */
const checkCameraSwitchCapability = async (): Promise<void> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    canSwitchCamera.value = videoDevices.length > 1;
    console.log('📱 [CAMERA] 카메라 장치 수:', videoDevices.length);
  } catch (err) {
    console.warn('⚠️ [CAMERA] 카메라 장치 확인 실패:', err);
    canSwitchCamera.value = false;
  }
};

/**
 * 카메라 전환 (전면/후면)
 */
const switchCamera = async (): Promise<void> => {
  if (!canSwitchCamera.value) return;

  try {
    currentFacingMode.value = currentFacingMode.value === 'user' ? 'environment' : 'user';
    await initializeCamera();
    console.log('🔄 [CAMERA] 카메라 전환:', currentFacingMode.value);
  } catch (err) {
    console.error('❌ [CAMERA] 카메라 전환 실패:', err);
    // 전환 실패 시 원래 모드로 복원
    currentFacingMode.value = currentFacingMode.value === 'user' ? 'environment' : 'user';
  }
};

/**
 * OCR 프레임 영역 계산
 */
const calculateOCRFrameArea = (videoWidth: number, videoHeight: number) => {
  // OCR 프레임 크기 (화면의 80%, 최대 400px, 3:2 비율)
  const frameWidthPercent = 0.8;
  const maxFrameWidth = 400;
  const aspectRatio = 3 / 2;

  let frameWidth = Math.min(videoWidth * frameWidthPercent, maxFrameWidth);
  let frameHeight = frameWidth / aspectRatio;

  // 프레임이 화면을 벗어나지 않도록 조정
  if (frameHeight > videoHeight * 0.8) {
    frameHeight = videoHeight * 0.8;
    frameWidth = frameHeight * aspectRatio;
  }

  // 중앙 정렬
  const frameX = (videoWidth - frameWidth) / 2;
  const frameY = (videoHeight - frameHeight) / 2;

  return {
    x: Math.round(frameX),
    y: Math.round(frameY),
    width: Math.round(frameWidth),
    height: Math.round(frameHeight)
  };
};

/**
 * 화면 캡처 (OCR 프레임 영역만)
 */
const captureImage = (): HTMLCanvasElement | null => {
  if (!videoRef.value || !canvasRef.value || !isStreamActive.value) {
    console.error('❌ [CAMERA] 캡처 불가: 카메라가 활성화되지 않음');
    return null;
  }

  try {
    const video = videoRef.value;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
    }

    // OCR 프레임 영역 계산
    const frameArea = calculateOCRFrameArea(video.videoWidth, video.videoHeight);

    // 캔버스 크기를 OCR 프레임 크기로 설정
    canvas.width = frameArea.width;
    canvas.height = frameArea.height;

    // OCR 프레임 영역만 캔버스에 그리기
    ctx.drawImage(
      video,
      frameArea.x, frameArea.y, frameArea.width, frameArea.height, // 소스 영역
      0, 0, frameArea.width, frameArea.height // 대상 영역
    );

    console.log('📸 [CAMERA] OCR 프레임 영역 캡처 완료:', {
      원본크기: `${video.videoWidth}x${video.videoHeight}`,
      프레임영역: `${frameArea.x},${frameArea.y} ${frameArea.width}x${frameArea.height}`,
      캡처크기: `${canvas.width}x${canvas.height}`
    });

    emit('capture', canvas);
    return canvas;

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '이미지 캡처 실패';
    console.error('❌ [CAMERA] 이미지 캡처 실패:', err);
    emit('error', errorMessage);
    return null;
  }
};

/**
 * 카메라 정지
 */
const stopCamera = (): void => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop();
    });
    mediaStream = null;
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }

  isStreamActive.value = false;
  console.log('🛑 [CAMERA] 카메라 정지');
};

// 컴포넌트 마운트 시 자동 시작
onMounted(() => {
  if (props.autoStart) {
    initializeCamera();
  }
});

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  stopCamera();
});

// 외부에서 사용할 수 있는 메서드 노출
defineExpose({
  initializeCamera,
  captureImage,
  stopCamera,
  switchCamera,
  isStreamActive: readonly(isStreamActive),
  isLoading: readonly(isLoading),
  error: readonly(error)
});
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.camera-video--hidden {
  opacity: 0;
}

.camera-loading,
.camera-error,
.camera-inactive {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1f2937;
  color: white;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #374151;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text,
.error-text,
.inactive-text {
  font-size: 0.875rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.error-icon,
.inactive-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button,
.start-button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover,
.start-button:hover {
  background-color: #2563eb;
}

.camera-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.control-button {
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgba(255, 255, 255, 0.9);
  color: #374151;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.control-button:hover {
  background-color: rgba(255, 255, 255, 1);
  transform: scale(1.05);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.control-button--stop {
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
}

.control-button--stop:hover {
  background-color: rgba(239, 68, 68, 1);
}

/* OCR 인식 영역 오버레이 */
.ocr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.ocr-frame {
  position: relative;
  width: 80%;
  max-width: 400px;
  aspect-ratio: 3/2;
  border-radius: 0.5rem;
}

/* 프레임 테두리 */
.ocr-frame-border {
  position: absolute;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.8) 20%,
    rgba(59, 130, 246, 0.8) 80%,
    transparent 100%
  );
  animation: pulse-border 2s ease-in-out infinite;
}

.ocr-frame-border--top,
.ocr-frame-border--bottom {
  left: 0;
  right: 0;
  height: 2px;
}

.ocr-frame-border--top {
  top: 0;
}

.ocr-frame-border--bottom {
  bottom: 0;
}

.ocr-frame-border--left,
.ocr-frame-border--right {
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(59, 130, 246, 0.8) 20%,
    rgba(59, 130, 246, 0.8) 80%,
    transparent 100%
  );
}

.ocr-frame-border--left {
  left: 0;
}

.ocr-frame-border--right {
  right: 0;
}

/* 프레임 모서리 */
.ocr-frame-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #3b82f6;
  background-color: rgba(59, 130, 246, 0.2);
  backdrop-filter: blur(2px);
}

.ocr-frame-corner--top-left {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 0.5rem;
}

.ocr-frame-corner--top-right {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 0.5rem;
}

.ocr-frame-corner--bottom-left {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 0.5rem;
}

.ocr-frame-corner--bottom-right {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 0.5rem;
}

/* 프레임 라벨 */
.ocr-frame-label {
  position: absolute;
  top: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  pointer-events: none;
}

.ocr-frame-text {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

@keyframes pulse-border {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .camera-container {
    border-radius: 0;
  }

  .camera-loading,
  .camera-error,
  .camera-inactive {
    padding: 1.5rem;
  }

  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border-width: 2px;
  }

  .loading-text,
  .error-text,
  .inactive-text {
    font-size: 0.8125rem;
  }

  .error-icon,
  .inactive-icon {
    font-size: 2.5rem;
  }

  .retry-button,
  .start-button {
    padding: 0.75rem 1.25rem;
    font-size: 0.9375rem;
    border-radius: 0.5rem;
  }

  .camera-controls {
    top: 0.75rem;
    right: 0.75rem;
    gap: 0.375rem;
  }

  .control-button {
    width: 2.75rem;
    height: 2.75rem;
    font-size: 1.125rem;
  }

  /* 모바일에서 OCR 프레임 조정 */
  .ocr-frame {
    width: 85%;
    max-width: 320px;
  }

  .ocr-frame-label {
    top: -2rem;
    padding: 0.375rem 0.75rem;
  }

  .ocr-frame-text {
    font-size: 0.8125rem;
  }

  .ocr-frame-corner {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }
}

/* 작은 모바일 화면 */
@media (max-width: 375px) {
  .camera-controls {
    top: 0.5rem;
    right: 0.5rem;
  }

  .control-button {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
  }
}

/* 가로 모드 최적화 */
@media (max-width: 768px) and (orientation: landscape) {
  .camera-loading,
  .camera-error,
  .camera-inactive {
    padding: 1rem;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.75rem;
  }

  .loading-text,
  .error-text,
  .inactive-text {
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .error-icon,
  .inactive-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }
}
</style>

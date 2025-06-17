import { createWorker, type Worker, PSM } from 'tesseract.js';
import type { OCRResult, OCRResponse, OCRServiceConfig } from '~/types/global';

/**
 * OCR 서비스를 위한 Composable
 * Tesseract.js v6를 사용하여 이미지에서 텍스트를 인식하고 실시간 미리보기를 제공합니다.
 */
export const useOCR = () => {
  // Tesseract.js Worker 인스턴스
  let tesseractWorker: Worker | null = null;
  let workerInitTime: number = 0; // Worker 초기화 시간
  let lastUsedTime: number = 0; // 마지막 사용 시간

  // 상태 관리
  const isInitialized = ref(false);
  const isProcessing = ref(false);
  const error = ref<string | null>(null);
  const progress = ref(0);
  const previewText = ref<string>(''); // 실시간 미리보기 텍스트
  const isPreviewMode = ref(false); // 미리보기 모드 활성화 여부

  // 성능 모니터링
  const processingStats = ref({
    totalProcessed: 0,
    averageTime: 0,
    lastProcessingTime: 0,
    memoryUsage: 0
  });

  // 기본 설정
  const defaultConfig: OCRServiceConfig = {
    maxImageSize: 2048, // 최대 이미지 크기 (픽셀)
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    timeout: 30000 // 30초 타임아웃
  };

  /**
   * Tesseract.js Worker 초기화
   */
  const initializeRecognizer = async (): Promise<void> => {
    try {
      // 기존 Worker 정리
      if (tesseractWorker) {
        await tesseractWorker.terminate();
        tesseractWorker = null;
      }

      console.log('🔧 [OCR] Tesseract.js Worker 초기화 시작...');
      progress.value = 10;

      // Tesseract.js Worker 생성 (한국어 + 영어 지원)
      tesseractWorker = await createWorker(['kor', 'eng'], 1, {
        logger: (m) => {
          console.log('📊 [Tesseract]', m);

          // 상세한 진행률 업데이트
          if (m.status === 'loading tesseract core') {
            progress.value = Math.max(20, Math.round((m.progress || 0) * 20 + 10));
          } else if (m.status === 'initializing tesseract') {
            progress.value = Math.max(30, Math.round((m.progress || 0) * 10 + 30));
          } else if (m.status === 'loading language traineddata') {
            progress.value = Math.max(40, Math.round((m.progress || 0) * 30 + 40));
          } else if (m.status === 'initializing api') {
            progress.value = Math.max(70, Math.round((m.progress || 0) * 20 + 70));
          } else if (m.status === 'initialized api') {
            progress.value = 100;
          } else if (m.status === 'recognizing text') {
            // OCR 진행률 (30-95% 범위)
            const ocrProgress = Math.round((m.progress || 0) * 65 + 30);
            progress.value = Math.max(30, Math.min(95, ocrProgress));
          }

          // 실시간 미리보기 업데이트
          if (isPreviewMode.value) {
            updatePreviewText(m);
          }
        }
      });

      // OCR 파라미터 설정
      await tesseractWorker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // 단일 텍스트 블록으로 가정
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzㄱ-ㅎㅏ-ㅣ가-힣 .,!?-()[]{}:;\'\"', // 한글, 영문, 숫자, 기본 기호
      });

      isInitialized.value = true;
      error.value = null;
      progress.value = 100;
      workerInitTime = Date.now();
      lastUsedTime = Date.now();

      // 자동 정리 타이머 시작
      startAutoCleanupTimer();

      console.log('✅ [OCR] Tesseract.js Worker 초기화 완료');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      error.value = `OCR 모델 초기화 실패: ${errorMessage}`;
      console.error('❌ [OCR] Tesseract.js Worker 초기화 실패:', err);
      throw err;
    }
  };

  /**
   * 실시간 미리보기 텍스트 업데이트 (Tesseract.js 로그 기반)
   */
  const updatePreviewText = (logMessage: any): void => {
    if (!isPreviewMode.value) return;

    const { status, progress: logProgress, userJobId, workerId } = logMessage;

    // 초기화 단계
    if (status === 'loading tesseract core') {
      const percent = Math.round((logProgress || 0) * 100);
      previewText.value = `OCR 엔진을 로딩하고 있습니다... ${percent}%`;
    } else if (status === 'initializing tesseract') {
      const percent = Math.round((logProgress || 0) * 100);
      previewText.value = `OCR 엔진을 초기화하고 있습니다... ${percent}%`;
    } else if (status === 'loading language traineddata') {
      const percent = Math.round((logProgress || 0) * 100);
      previewText.value = `한국어/영어 모델을 로딩하고 있습니다... ${percent}%`;
    } else if (status === 'initializing api') {
      const percent = Math.round((logProgress || 0) * 100);
      previewText.value = `OCR API를 초기화하고 있습니다... ${percent}%`;
    } else if (status === 'initialized api') {
      previewText.value = 'OCR 준비 완료! 이미지를 분석합니다...';
    }

    // OCR 처리 단계
    else if (status === 'recognizing text') {
      const percent = Math.round((logProgress || 0) * 100);
      if (percent < 20) {
        previewText.value = `이미지를 분석하고 있습니다... ${percent}%`;
      } else if (percent < 50) {
        previewText.value = `텍스트 영역을 감지하고 있습니다... ${percent}%`;
      } else if (percent < 80) {
        previewText.value = `문자를 인식하고 있습니다... ${percent}%`;
      } else {
        previewText.value = `텍스트 인식을 완료하고 있습니다... ${percent}%`;
      }
    }

    // 기타 상태
    else if (status === 'loading image') {
      previewText.value = '이미지를 로딩하고 있습니다...';
    } else if (status === 'preprocessing image') {
      previewText.value = '이미지를 전처리하고 있습니다...';
    } else if (status === 'recognizing text') {
      const percent = Math.round((logProgress || 0) * 100);
      previewText.value = `텍스트를 인식하고 있습니다... ${percent}%`;
    }
  };

  /**
   * 이미지 전처리 (OCR 정확도 향상을 위한)
   */
  const preprocessImage = (canvas: HTMLCanvasElement, options: {
    enableGrayscale?: boolean;
    enableContrast?: boolean;
    enableSharpening?: boolean;
    enableNoiseReduction?: boolean;
    contrastLevel?: number;
  } = {}): HTMLCanvasElement => {
    const {
      enableGrayscale = true,
      enableContrast = true,
      enableSharpening = false,
      enableNoiseReduction = false,
      contrastLevel = 1.5
    } = options;

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 1. 그레이스케일 변환
    if (enableGrayscale) {
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        // Alpha는 그대로 유지
      }
    }

    // 2. 대비 향상
    if (enableContrast) {
      for (let i = 0; i < data.length; i += 4) {
        // 대비 향상 공식: newValue = (oldValue - 128) * contrast + 128
        data[i] = Math.max(0, Math.min(255, (data[i] - 128) * contrastLevel + 128));
        data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * contrastLevel + 128));
        data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * contrastLevel + 128));
      }
    }

    // 3. 노이즈 제거 (간단한 미디언 필터)
    if (enableNoiseReduction) {
      const processedData = new Uint8ClampedArray(data);
      const width = canvas.width;
      const height = canvas.height;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) { // RGB 채널만
            const neighbors = [];
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                neighbors.push(data[idx]);
              }
            }
            neighbors.sort((a, b) => a - b);
            const medianValue = neighbors[Math.floor(neighbors.length / 2)];
            const idx = (y * width + x) * 4 + c;
            processedData[idx] = medianValue;
          }
        }
      }
      data.set(processedData);
    }

    // 4. 샤프닝 (선택적)
    if (enableSharpening) {
      const processedData = new Uint8ClampedArray(data);
      const width = canvas.width;
      const height = canvas.height;

      // 샤프닝 커널
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) { // RGB 채널만
            let sum = 0;
            for (let ky = 0; ky < 3; ky++) {
              for (let kx = 0; kx < 3; kx++) {
                const idx = ((y + ky - 1) * width + (x + kx - 1)) * 4 + c;
                sum += data[idx] * kernel[ky * 3 + kx];
              }
            }
            const idx = (y * width + x) * 4 + c;
            processedData[idx] = Math.max(0, Math.min(255, sum));
          }
        }
      }
      data.set(processedData);
    }

    // 전처리된 이미지를 새 캔버스에 그리기
    const processedCanvas = document.createElement('canvas');
    processedCanvas.width = canvas.width;
    processedCanvas.height = canvas.height;
    const processedCtx = processedCanvas.getContext('2d')!;
    processedCtx.putImageData(imageData, 0, 0);

    return processedCanvas;
  };

  /**
   * Tesseract.js를 사용한 실제 OCR 수행
   */
  const performOCR = async (canvas: HTMLCanvasElement, options: {
    enablePreprocessing?: boolean;
    preprocessingOptions?: {
      enableGrayscale?: boolean;
      enableContrast?: boolean;
      enableSharpening?: boolean;
      enableNoiseReduction?: boolean;
      contrastLevel?: number;
    };
    optimizeSize?: boolean;
  } = {}): Promise<any> => {
    if (!tesseractWorker) {
      throw new Error('Tesseract Worker가 초기화되지 않았습니다.');
    }

    try {
      console.log('🔍 [OCR] Tesseract.js OCR 시작');
      lastUsedTime = Date.now(); // 사용 시간 업데이트

      let processedCanvas = canvas;

      // 1. 이미지 크기 최적화
      if (options.optimizeSize !== false) {
        processedCanvas = optimizeImageSize(processedCanvas, {
          maxWidth: 2048,
          maxHeight: 2048,
          minWidth: 300,
          minHeight: 100
        });
      }

      // 2. 이미지 전처리
      if (options.enablePreprocessing !== false) {
        const preprocessingOptions = {
          enableGrayscale: true,
          enableContrast: true,
          enableSharpening: false,
          enableNoiseReduction: false,
          contrastLevel: 1.3,
          ...options.preprocessingOptions
        };

        processedCanvas = preprocessImage(processedCanvas, preprocessingOptions);

        console.log('🔧 [OCR] 이미지 전처리 완료:', {
          크기: `${processedCanvas.width}x${processedCanvas.height}`,
          전처리옵션: preprocessingOptions
        });
      }

      // 3. Tesseract.js로 텍스트 인식
      const result = await tesseractWorker.recognize(processedCanvas);

      console.log('✅ [OCR] Tesseract.js OCR 완료:', {
        신뢰도: result.data.confidence,
        텍스트길이: result.data.text.length,
        블록수: result.data.blocks?.length || 0
      });

      return result;
    } catch (err) {
      console.error('❌ [OCR] Tesseract.js OCR 실패:', err);
      throw err;
    }
  };

  /**
   * File을 Canvas로 변환
   */
  const fileToCanvas = async (imageFile: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 캔버스에 이미지 그리기
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // 원본 이미지 크기 유지 (OCR 정확도를 위해)
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(img.src);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('이미지 로드 실패'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  };

  /**
   * 이미지 크기 최적화 (OCR 성능 최적화)
   */
  const optimizeImageSize = (canvas: HTMLCanvasElement, options: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    quality?: number;
  } = {}): HTMLCanvasElement => {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      minWidth = 300,
      minHeight = 100,
      quality = 0.9
    } = options;

    let { width, height } = canvas;

    // 최소 크기 확인
    if (width < minWidth || height < minHeight) {
      const scaleX = minWidth / width;
      const scaleY = minHeight / height;
      const scale = Math.max(scaleX, scaleY);
      width *= scale;
      height *= scale;
    }

    // 최대 크기 확인
    if (width > maxWidth || height > maxHeight) {
      const scaleX = maxWidth / width;
      const scaleY = maxHeight / height;
      const scale = Math.min(scaleX, scaleY);
      width *= scale;
      height *= scale;
    }

    // 크기가 변경되지 않은 경우 원본 반환
    if (width === canvas.width && height === canvas.height) {
      return canvas;
    }

    // 새 캔버스에 리사이즈된 이미지 그리기
    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d')!;

    resizedCanvas.width = Math.round(width);
    resizedCanvas.height = Math.round(height);

    // 고품질 리샘플링 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

    console.log('🔧 [OCR] 이미지 크기 최적화:', {
      원본: `${canvas.width}x${canvas.height}`,
      최적화: `${resizedCanvas.width}x${resizedCanvas.height}`
    });

    return resizedCanvas;
  };

  /**
   * 이미지 크기 조정 (File 버전)
   */
  const resizeImage = (file: File, maxSize: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // 비율 유지하면서 크기 조정
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  /**
   * 이미지에서 텍스트 인식 (Tesseract.js 사용)
   */
  const recognizeText = async (
    imageFile: File,
    config: Partial<OCRServiceConfig> = {}
  ): Promise<OCRResponse> => {
    const finalConfig = { ...defaultConfig, ...config };

    try {
      // 상태 초기화
      isProcessing.value = true;
      error.value = null;
      progress.value = 0;

      // 미리보기 모드 활성화
      setPreviewMode(true);
      clearPreview();

      // 파일 형식 검증
      if (!finalConfig.supportedFormats.includes(imageFile.type)) {
        throw new Error(`지원하지 않는 파일 형식입니다: ${imageFile.type}`);
      }

      // 모델 초기화 (필요한 경우)
      if (!isInitialized.value || !tesseractWorker) {
        await initializeRecognizer();
      }

      console.log('🔍 [OCR] Tesseract.js 텍스트 인식 시작:', imageFile.name);
      const startTime = Date.now();

      // 이미지를 캔버스로 변환
      const canvas = await fileToCanvas(imageFile);
      progress.value = 30;

      // 미리보기 업데이트
      previewText.value = '이미지를 분석하고 있습니다...';

      // Tesseract.js OCR 실행 (전처리 옵션 포함)
      const result = await performOCR(canvas, {
        enablePreprocessing: true,
        preprocessingOptions: {
          enableGrayscale: true,
          enableContrast: true,
          enableSharpening: false, // 파일 업로드에서는 성능상 비활성화
          enableNoiseReduction: false, // 파일 업로드에서는 성능상 비활성화
          contrastLevel: 1.3 // 텍스트 인식을 위해 대비 강화
        },
        optimizeSize: true
      });
      const processingTime = Date.now() - startTime;
      progress.value = 100;

      // 결과 처리
      const ocrResults: OCRResult[] = [];
      let recognizedText = '';

      if (result.data && result.data.text) {
        recognizedText = result.data.text.trim();

        // 단어별 결과 처리
        if (result.data.words && result.data.words.length > 0) {
          result.data.words.forEach((word: any) => {
            if (word.text && word.text.trim() && word.confidence > 30) {
              ocrResults.push({
                text: word.text.trim(),
                confidence: Math.round(word.confidence),
                boundingBox: word.bbox ? {
                  x: word.bbox.x0,
                  y: word.bbox.y0,
                  width: word.bbox.x1 - word.bbox.x0,
                  height: word.bbox.y1 - word.bbox.y0,
                } : undefined
              });
            }
          });
        } else if (recognizedText) {
          // 전체 텍스트만 있는 경우
          ocrResults.push({
            text: recognizedText,
            confidence: Math.round(result.data.confidence || 0),
            boundingBox: undefined
          });
        }
      }

      // 미리보기를 실제 인식된 텍스트로 업데이트
      if (recognizedText) {
        previewText.value = recognizedText;
      } else {
        previewText.value = '텍스트를 찾을 수 없습니다.';
      }

      const response: OCRResponse = {
        success: true,
        results: ocrResults,
        processingTime
      };

      // 성능 통계 업데이트
      updateProcessingStats(processingTime);

      console.log('✅ [OCR] Tesseract.js 텍스트 인식 완료:', {
        텍스트길이: recognizedText.length,
        처리시간: `${processingTime}ms`,
        결과수: ocrResults.length,
        신뢰도: result.data.confidence
      });

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      error.value = errorMessage;

      console.error('❌ [OCR] Tesseract.js 텍스트 인식 실패:', err);

      return {
        success: false,
        results: [],
        error: errorMessage
      };
    } finally {
      isProcessing.value = false;
      progress.value = 0;

      // 미리보기 모드 비활성화 (약간의 지연 후)
      setTimeout(() => {
        setPreviewMode(false);
      }, 1000);
    }
  };

  /**
   * Canvas에서 이미지 캡처 후 텍스트 인식 (Tesseract.js 사용)
   */
  const recognizeFromCanvas = async (
    canvas: HTMLCanvasElement,
    config: Partial<OCRServiceConfig> = {}
  ): Promise<OCRResponse> => {
    try {
      // 상태 초기화
      isProcessing.value = true;
      error.value = null;
      progress.value = 0;

      // 미리보기 모드 활성화
      setPreviewMode(true);
      clearPreview();

      // 모델 초기화 (필요한 경우)
      if (!isInitialized.value || !tesseractWorker) {
        await initializeRecognizer();
      }

      console.log('🔍 [OCR] Canvas에서 Tesseract.js 텍스트 인식 시작');
      const startTime = Date.now();

      progress.value = 30;

      // 미리보기 업데이트
      previewText.value = '캔버스 이미지를 분석하고 있습니다...';

      // Tesseract.js OCR 실행 (전처리 옵션 포함)
      const result = await performOCR(canvas, {
        enablePreprocessing: true,
        preprocessingOptions: {
          enableGrayscale: true,
          enableContrast: true,
          enableSharpening: false, // 모바일에서는 성능상 비활성화
          enableNoiseReduction: false, // 모바일에서는 성능상 비활성화
          contrastLevel: 1.4 // 텍스트 인식을 위해 대비 강화
        },
        optimizeSize: true
      });
      const processingTime = Date.now() - startTime;
      progress.value = 100;

      // 결과 처리
      const ocrResults: OCRResult[] = [];
      let recognizedText = '';

      if (result.data && result.data.text) {
        recognizedText = result.data.text.trim();

        // 단어별 결과 처리
        if (result.data.words && result.data.words.length > 0) {
          result.data.words.forEach((word: any) => {
            if (word.text && word.text.trim() && word.confidence > 30) {
              ocrResults.push({
                text: word.text.trim(),
                confidence: Math.round(word.confidence),
                boundingBox: word.bbox ? {
                  x: word.bbox.x0,
                  y: word.bbox.y0,
                  width: word.bbox.x1 - word.bbox.x0,
                  height: word.bbox.y1 - word.bbox.y0,
                } : undefined
              });
            }
          });
        } else if (recognizedText) {
          // 전체 텍스트만 있는 경우
          ocrResults.push({
            text: recognizedText,
            confidence: Math.round(result.data.confidence || 0),
            boundingBox: undefined
          });
        }
      }

      // 미리보기를 실제 인식된 텍스트로 업데이트
      if (recognizedText) {
        previewText.value = recognizedText;
      } else {
        previewText.value = '텍스트를 찾을 수 없습니다.';
      }

      const response: OCRResponse = {
        success: true,
        results: ocrResults,
        processingTime
      };

      // 성능 통계 업데이트
      updateProcessingStats(processingTime);

      console.log('✅ [OCR] Canvas Tesseract.js 텍스트 인식 완료:', {
        텍스트길이: recognizedText.length,
        처리시간: `${processingTime}ms`,
        결과수: ocrResults.length,
        신뢰도: result.data.confidence
      });

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      error.value = errorMessage;

      console.error('❌ [OCR] Canvas Tesseract.js 텍스트 인식 실패:', err);

      return {
        success: false,
        results: [],
        error: errorMessage
      };
    } finally {
      isProcessing.value = false;
      progress.value = 0;

      // 미리보기 모드 비활성화 (약간의 지연 후)
      setTimeout(() => {
        setPreviewMode(false);
      }, 1000);
    }
  };

  /**
   * 미리보기 모드 활성화/비활성화
   */
  const setPreviewMode = (enabled: boolean): void => {
    isPreviewMode.value = enabled;
    if (!enabled) {
      previewText.value = '';
    }
  };

  /**
   * 미리보기 텍스트 초기화
   */
  const clearPreview = (): void => {
    previewText.value = '';
  };

  /**
   * 성능 통계 업데이트
   */
  const updateProcessingStats = (processingTime: number): void => {
    processingStats.value.totalProcessed++;
    processingStats.value.lastProcessingTime = processingTime;

    // 평균 처리 시간 계산 (이동 평균)
    const alpha = 0.1; // 가중치
    if (processingStats.value.averageTime === 0) {
      processingStats.value.averageTime = processingTime;
    } else {
      processingStats.value.averageTime =
        alpha * processingTime + (1 - alpha) * processingStats.value.averageTime;
    }

    // 메모리 사용량 추정 (브라우저 API 사용 가능한 경우)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      processingStats.value.memoryUsage = Math.round(memInfo.usedJSHeapSize / 1024 / 1024); // MB
    }

    console.log('📊 [OCR] 성능 통계:', {
      총처리횟수: processingStats.value.totalProcessed,
      평균처리시간: `${Math.round(processingStats.value.averageTime)}ms`,
      마지막처리시간: `${processingTime}ms`,
      메모리사용량: `${processingStats.value.memoryUsage}MB`
    });
  };

  /**
   * Worker 자동 정리 (메모리 최적화)
   */
  const autoCleanupWorker = (): void => {
    const CLEANUP_TIMEOUT = 5 * 60 * 1000; // 5분 후 자동 정리

    if (tesseractWorker && lastUsedTime > 0) {
      const timeSinceLastUse = Date.now() - lastUsedTime;

      if (timeSinceLastUse > CLEANUP_TIMEOUT) {
        console.log('🧹 [OCR] Worker 자동 정리 (5분 미사용)');
        cleanup();
      }
    }
  };

  /**
   * OCR 모델 정리
   */
  const cleanup = async (): Promise<void> => {
    try {
      // Tesseract Worker 정리
      if (tesseractWorker) {
        await tesseractWorker.terminate();
        tesseractWorker = null;
      }

      // 상태 초기화
      isInitialized.value = false;
      isProcessing.value = false;
      error.value = null;
      progress.value = 0;
      previewText.value = '';
      isPreviewMode.value = false;
      workerInitTime = 0;
      lastUsedTime = 0;

      console.log('🧹 [OCR] Tesseract.js Worker 정리 완료');
    } catch (err) {
      console.error('❌ [OCR] OCR 모델 정리 실패:', err);
    }
  };

  /**
   * File을 HTMLImageElement로 변환
   */
  const createImageElement = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('이미지 로드 실패'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // 자동 정리 타이머 설정
  let cleanupTimer: NodeJS.Timeout | null = null;

  const startAutoCleanupTimer = (): void => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
    }

    // 1분마다 자동 정리 체크
    cleanupTimer = setInterval(autoCleanupWorker, 60 * 1000);
  };

  // 컴포넌트 언마운트 시 정리
  onUnmounted(() => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
    }
    cleanup();
  });

  return {
    // 상태
    isInitialized: readonly(isInitialized),
    isProcessing: readonly(isProcessing),
    error: readonly(error),
    progress: readonly(progress),
    previewText: readonly(previewText),
    isPreviewMode: readonly(isPreviewMode),
    processingStats: readonly(processingStats),

    // 메서드
    initializeRecognizer,
    recognizeText,
    recognizeFromCanvas,
    cleanup,
    setPreviewMode,
    clearPreview,
    createImageElement,
    fileToCanvas,
    resizeImage,
    optimizeImageSize,
    preprocessImage,
    performOCR,

    // 설정
    defaultConfig
  };
};

/**
 * OCR 기능 테스트
 * Tesseract.js v6 기반 OCR 기능의 단위 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useOCR } from '~/composables/useOCR';

// Tesseract.js 모킹
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => ({
    setParameters: vi.fn(),
    recognize: vi.fn(() => ({
      data: {
        text: 'Hello World',
        confidence: 95,
        words: [
          {
            text: 'Hello',
            confidence: 96,
            bbox: { x0: 10, y0: 10, x1: 50, y1: 30 }
          },
          {
            text: 'World',
            confidence: 94,
            bbox: { x0: 60, y0: 10, x1: 100, y1: 30 }
          }
        ]
      }
    })),
    terminate: vi.fn()
  })),
  PSM: {
    SINGLE_BLOCK: 6
  }
}));

describe('useOCR', () => {
  let ocr: ReturnType<typeof useOCR>;

  beforeEach(() => {
    ocr = useOCR();
  });

  afterEach(async () => {
    await ocr.cleanup();
  });

  describe('초기화', () => {
    it('초기 상태가 올바르게 설정되어야 함', () => {
      expect(ocr.isInitialized.value).toBe(false);
      expect(ocr.isProcessing.value).toBe(false);
      expect(ocr.error.value).toBe(null);
      expect(ocr.progress.value).toBe(0);
      expect(ocr.previewText.value).toBe('');
      expect(ocr.isPreviewMode.value).toBe(false);
    });

    it('OCR 모델이 성공적으로 초기화되어야 함', async () => {
      await ocr.initializeRecognizer();
      expect(ocr.isInitialized.value).toBe(true);
      expect(ocr.error.value).toBe(null);
    });
  });

  describe('이미지 처리', () => {
    beforeEach(async () => {
      await ocr.initializeRecognizer();
    });

    it('Canvas에서 텍스트를 인식해야 함', async () => {
      // 테스트용 Canvas 생성
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 200, 100);
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText('Hello World', 10, 50);

      const result = await ocr.recognizeFromCanvas(canvas);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].text).toBe('Hello');
      expect(result.results[1].text).toBe('World');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('File에서 텍스트를 인식해야 함', async () => {
      // 테스트용 이미지 파일 생성 (실제로는 Canvas를 Blob으로 변환)
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 200, 100);
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText('Test Text', 10, 50);

      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const file = new File([blob], 'test.png', { type: 'image/png' });
      const result = await ocr.recognizeText(file);

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('미리보기 기능', () => {
    it('미리보기 모드를 활성화/비활성화할 수 있어야 함', () => {
      ocr.setPreviewMode(true);
      expect(ocr.isPreviewMode.value).toBe(true);

      ocr.setPreviewMode(false);
      expect(ocr.isPreviewMode.value).toBe(false);
      expect(ocr.previewText.value).toBe('');
    });

    it('미리보기 텍스트를 초기화할 수 있어야 함', () => {
      ocr.setPreviewMode(true);
      // 미리보기 텍스트 설정 (내부적으로)
      ocr.clearPreview();
      expect(ocr.previewText.value).toBe('');
    });
  });

  describe('성능 통계', () => {
    beforeEach(async () => {
      await ocr.initializeRecognizer();
    });

    it('처리 통계가 올바르게 업데이트되어야 함', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;

      const initialStats = ocr.processingStats.value;
      expect(initialStats.totalProcessed).toBe(0);

      await ocr.recognizeFromCanvas(canvas);

      const updatedStats = ocr.processingStats.value;
      expect(updatedStats.totalProcessed).toBe(1);
      expect(updatedStats.lastProcessingTime).toBeGreaterThan(0);
      expect(updatedStats.averageTime).toBeGreaterThan(0);
    });
  });

  describe('오류 처리', () => {
    it('지원하지 않는 파일 형식에 대해 오류를 반환해야 함', async () => {
      await ocr.initializeRecognizer();

      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = await ocr.recognizeText(invalidFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('지원하지 않는 파일 형식');
    });

    it('초기화되지 않은 상태에서 OCR 실행 시 자동 초기화되어야 함', async () => {
      expect(ocr.isInitialized.value).toBe(false);

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;

      const result = await ocr.recognizeFromCanvas(canvas);

      expect(ocr.isInitialized.value).toBe(true);
      expect(result.success).toBe(true);
    });
  });

  describe('메모리 관리', () => {
    it('cleanup 함수가 모든 리소스를 정리해야 함', async () => {
      await ocr.initializeRecognizer();
      expect(ocr.isInitialized.value).toBe(true);

      await ocr.cleanup();

      expect(ocr.isInitialized.value).toBe(false);
      expect(ocr.isProcessing.value).toBe(false);
      expect(ocr.error.value).toBe(null);
      expect(ocr.progress.value).toBe(0);
      expect(ocr.previewText.value).toBe('');
      expect(ocr.isPreviewMode.value).toBe(false);
    });
  });
});

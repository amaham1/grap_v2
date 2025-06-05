// composables/useGasPriceUpdateInfo.ts
import type { Ref } from 'vue';

/**
 * 주유소 가격 업데이트 정보 인터페이스
 */
export interface GasPriceUpdateInfo {
  latest_update_date: string | null;
  formatted_date: string | null;
  update_schedule: string;
}

/**
 * API 응답 인터페이스
 */
interface GasPriceUpdateInfoResponse {
  success: boolean;
  data: GasPriceUpdateInfo;
  timestamp: string;
}

/**
 * 주유소 가격 업데이트 정보 관리 컴포저블
 */
export const useGasPriceUpdateInfo = () => {
  // 반응형 상태
  const updateInfo: Ref<GasPriceUpdateInfo | null> = ref(null);
  const isLoading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  /**
   * 가격 업데이트 정보 조회
   */
  const fetchUpdateInfo = async (): Promise<void> => {
    if (isLoading.value) return; // 이미 로딩 중이면 중복 요청 방지

    isLoading.value = true;
    error.value = null;

    try {

      const response = await $fetch<GasPriceUpdateInfoResponse>('/api/public/gas-price-update-info');

      if (response.success && response.data) {
        updateInfo.value = response.data;
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err: any) {
      console.error('❌ [COMPOSABLE] 가격 업데이트 정보 조회 실패:', err);
      error.value = err.message || '가격 업데이트 정보를 불러오는데 실패했습니다.';
      updateInfo.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 업데이트 정보 초기화
   */
  const resetUpdateInfo = (): void => {
    updateInfo.value = null;
    error.value = null;
    isLoading.value = false;
  };

  /**
   * 업데이트 상태 텍스트 (DB의 실제 시간 표시)
   */
  const updateStatusText = computed((): string => {
    if (!updateInfo.value?.latest_update_date) return '업데이트 정보 없음';

    // API에서 포맷된 날짜시간을 그대로 사용
    return updateInfo.value.formatted_date || updateInfo.value.latest_update_date;
  });

  return {
    // 상태
    updateInfo: readonly(updateInfo),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 계산된 속성
    updateStatusText,

    // 메서드
    fetchUpdateInfo,
    resetUpdateInfo
  };
};

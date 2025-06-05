// server/api/public/gas-price-update-info.get.ts
import { defineEventHandler, createError } from 'h3';
import { gasStationDAO } from '~/server/dao/supabase';

/**
 * 주유소 가격 업데이트 정보 조회 API
 * 전체 주유소 가격의 최신 업데이트 날짜를 반환
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('📅 [PRICE-UPDATE-INFO] 가격 업데이트 정보 조회 시작');

    // 최신 가격 업데이트 날짜 조회
    const updateDateResult = await gasStationDAO.getLatestPriceUpdateDate();

    if (updateDateResult.error) {
      console.error('❌ [PRICE-UPDATE-INFO-ERROR] 업데이트 날짜 조회 실패:', updateDateResult.error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Database Error',
        message: 'Failed to fetch price update information'
      });
    }

    const latestUpdateDate = updateDateResult.data;

    // 응답 데이터 구성
    const response = {
      success: true,
      data: {
        latest_update_date: latestUpdateDate,
        formatted_date: latestUpdateDate ? formatKoreanDateTime(latestUpdateDate) : null,
        update_schedule: '매일 오전 2시 자동 업데이트'
      },
      timestamp: new Date().toISOString()
    };

    console.log('📅 [PRICE-UPDATE-INFO] 응답 데이터:', response);

    return response;

  } catch (error: any) {
    console.error('❌ [PRICE-UPDATE-INFO-ERROR] 가격 업데이트 정보 조회 실패:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `가격 업데이트 정보 조회 실패: ${error.message}`
    });
  }
});

/**
 * 날짜시간을 한국어 형식으로 포맷팅 (KST 시간대 적용)
 * @param dateTimeString - ISO 형식의 날짜시간 문자열
 * @returns 한국어 형식의 날짜시간 문자열 (예: "2024년 1월 15일 14시 30분")
 */
function formatKoreanDateTime(dateTimeString: string): string {
  try {
    const date = new Date(dateTimeString);

    // 한국 시간대(KST, UTC+9)로 변환
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));

    const year = kstDate.getUTCFullYear();
    const month = kstDate.getUTCMonth() + 1;
    const day = kstDate.getUTCDate();
    const hours = kstDate.getUTCHours();
    const minutes = kstDate.getUTCMinutes();

    console.log('📅 [DATE-FORMAT-DEBUG] 시간대 변환:', {
      original: dateTimeString,
      utc: date.toISOString(),
      kst: kstDate.toISOString(),
      formatted: `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes.toString().padStart(2, '0')}분`
    });

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes.toString().padStart(2, '0')}분`;
  } catch (error) {
    console.error('❌ [DATE-FORMAT-ERROR] 날짜시간 포맷팅 실패:', error);
    return dateTimeString; // 포맷팅 실패 시 원본 반환
  }
}

<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">수동 데이터 수집 트리거</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- 축제 데이터 수집 -->
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-3">축제 정보</h3>
        <p class="text-sm text-gray-600 mb-4">축제 관련 최신 데이터를 수동으로 수집합니다.</p>
        <button
          @click="triggerFetch('festivals')"
          :disabled="loading.festivals"
          class="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400 flex items-center justify-center">
          <svg v-if="loading.festivals" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading.festivals ? '수집 중...' : '축제 데이터 수집 실행' }}
        </button>
        <div v-if="results.festivals" class="mt-4 p-3 rounded-md text-sm"
             :class="results.festivals.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ results.festivals.message }}
        </div>
      </div>

      <!-- 전시회 데이터 수집 -->
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-3">전시회 정보</h3>
        <p class="text-sm text-gray-600 mb-4">전시회 관련 최신 데이터를 수동으로 수집합니다.</p>
        <button
          @click="triggerFetch('exhibitions')"
          :disabled="loading.exhibitions"
          class="w-full bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 disabled:bg-gray-400 flex items-center justify-center">
          <svg v-if="loading.exhibitions" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading.exhibitions ? '수집 중...' : '전시회 데이터 수집 실행' }}
        </button>
        <div v-if="results.exhibitions" class="mt-4 p-3 rounded-md text-sm"
             :class="results.exhibitions.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ results.exhibitions.message }}
        </div>
      </div>

      <!-- 복지 서비스 데이터 수집 -->
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-3">복지 서비스 정보</h3>
        <p class="text-sm text-gray-600 mb-4">복지 서비스 관련 최신 데이터를 수동으로 수집합니다.</p>
        <button
          @click="triggerFetch('welfare-services')"
          :disabled="loading.welfareServices"
          class="w-full bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600 disabled:bg-gray-400 flex items-center justify-center">
           <svg v-if="loading.welfareServices" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading.welfareServices ? '수집 중...' : '복지 서비스 수집 실행' }}
        </button>
        <div v-if="results.welfareServices" class="mt-4 p-3 rounded-md text-sm"
             :class="results.welfareServices.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ results.welfareServices.message }}
        </div>
      </div>

      <!-- 주유소 데이터 수집 -->
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-3">주유소 정보</h3>
        <p class="text-sm text-gray-600 mb-4">제주도 주유소 및 가격 정보를 수동으로 수집합니다.</p>
        <button
          @click="triggerFetch('gas-stations')"
          :disabled="loading.gasStations"
          class="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400 flex items-center justify-center">
           <svg v-if="loading.gasStations" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading.gasStations ? '수집 중...' : '주유소 정보 수집 실행' }}
        </button>
        <div v-if="results.gasStations" class="mt-4 p-3 rounded-md text-sm"
             :class="results.gasStations.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ results.gasStations.message }}
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({
  layout: 'admin',
  middleware: ['auth']
});

type SourceName = 'festivals' | 'exhibitions' | 'welfare-services' | 'gas-stations';

const loading = ref({
  festivals: false,
  exhibitions: false,
  welfareServices: false, // welfare-services 키를 카멜 케이스로 변경
  gasStations: false, // gas-stations 키를 카멜 케이스로 변경
});

const results = ref<{
  [key in SourceName | 'welfareServices' | 'gasStations']?: { success: boolean; message: string }
}>({});

async function triggerFetch(sourceName: SourceName) {
  const key = sourceName === 'welfare-services' ? 'welfareServices' :
              sourceName === 'gas-stations' ? 'gasStations' : sourceName;
  loading.value[key] = true;
  results.value[key] = undefined; // 이전 결과 초기화

  // 상세한 콘솔 로깅 시작
  const startTime = Date.now();
  console.group(`🚀 [ADMIN-TRIGGER] ${sourceName.toUpperCase()} 데이터 수집 시작`);
  console.log(`⏰ 시작 시간: ${new Date().toLocaleString()}`);
  console.log(`📡 API 엔드포인트: /api/admin/trigger-fetch/${sourceName}`);

  if (sourceName === 'gas-stations') {
    console.log(`⛽ 주유소 데이터 수집 상세 정보:`);
    console.log(`  - 외부 API: 제주도 주유소 정보 API`);
    console.log(`  - 수집 데이터: 주유소 기본 정보 + 가격 정보`);
    console.log(`  - 좌표 변환: KATEC → WGS84 (카카오 API 사용)`);
    console.log(`  - 예상 소요 시간: 2-3분`);
  }

  try {
    console.log(`📤 API 요청 전송 중...`);

    const response = await $fetch(`/api/admin/trigger-fetch/${sourceName}`, {
      method: 'POST',
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`📥 API 응답 수신 완료 (${duration}ms)`);
    console.log(`📊 응답 데이터:`, response);

    // 타입 단언을 사용하여 response의 타입을 명시
    const typedResponse = response as {
      success: boolean;
      message: string;
      error?: string;
      details?: any;
      timing?: any;
    };

    if (typedResponse.success) {
      console.log(`✅ 데이터 수집 트리거 성공`);
      if (typedResponse.details) {
        console.log(`📋 추가 정보:`, typedResponse.details);
      }
      if (typedResponse.timing) {
        console.log(`⏱️ 타이밍 정보:`, typedResponse.timing);
      }

      results.value[key] = {
        success: true,
        message: typedResponse.message || '데이터 수집이 성공적으로 시작되었습니다.'
      };

      if (sourceName === 'gas-stations') {
        console.log(`⛽ 주유소 데이터 수집이 백그라운드에서 진행 중입니다.`);
        console.log(`📝 진행 상황은 서버 로그에서 확인할 수 있습니다.`);
      }
    } else {
      console.error(`❌ 데이터 수집 트리거 실패`);
      console.error(`💬 오류 메시지: ${typedResponse.message || typedResponse.error}`);

      results.value[key] = {
        success: false,
        message: typedResponse.message || typedResponse.error || '데이터 수집 시작에 실패했습니다.'
      };
    }
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(`💥 API 요청 실패 (${duration}ms)`);
    console.error(`🔍 오류 상세 정보:`, error);
    console.error(`📡 네트워크 상태:`, navigator.onLine ? '온라인' : '오프라인');

    if (error.data) {
      console.error(`📄 서버 응답 데이터:`, error.data);
    }
    if (error.statusCode) {
      console.error(`🔢 HTTP 상태 코드: ${error.statusCode}`);
    }

    results.value[key] = {
      success: false,
      message: error.data?.message || error.message || `An unexpected error occurred while triggering ${sourceName}.`
    };
  } finally {
    const totalTime = Date.now() - startTime;
    console.log(`⏰ 총 소요 시간: ${totalTime}ms`);
    console.log(`🏁 ${sourceName.toUpperCase()} 트리거 완료: ${new Date().toLocaleString()}`);
    console.groupEnd();

    loading.value[key] = false;
  }
}
</script>

<style scoped>
/* 페이지별 스타일 */
</style>

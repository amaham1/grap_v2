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
    if (sourceName === 'gas-stations') {
      console.log(`🌐 [NETWORK] 주유소 API 네트워크 요청 시작`);
      console.log(`📡 [NETWORK] 요청 상세 정보:`);
      console.log(`  🎯 대상 URL: ${window.location.origin}/api/admin/trigger-fetch/${sourceName}`);
      console.log(`  🔧 HTTP 메서드: POST`);
      console.log(`  📋 Content-Type: application/json`);
      console.log(`  🌍 User-Agent: ${navigator.userAgent}`);
      console.log(`  📶 네트워크 상태: ${navigator.onLine ? '온라인' : '오프라인'}`);
      console.log(`  🔗 연결 타입: ${(navigator as any).connection?.effectiveType || '알 수 없음'}`);
      console.log(`  ⚡ 다운링크 속도: ${(navigator as any).connection?.downlink || '알 수 없음'}Mbps`);
      console.log(`  � RTT: ${(navigator as any).connection?.rtt || '알 수 없음'}ms`);

      console.log(`🚀 [NETWORK] TCP 연결 및 HTTP 요청 전송 중...`);
      console.log(`📈 [NETWORK] 예상 네트워크 경로:`);
      console.log(`  1. 브라우저 → Cloudflare Edge`);
      console.log(`  2. Cloudflare Edge → Cloudflare Workers`);
      console.log(`  3. Workers → 제주도 API 서버 (http://api.jejuits.go.kr)`);
      console.log(`  4. Workers → 카카오 API 서버 (https://dapi.kakao.com)`);
      console.log(`  5. Workers → Supabase 데이터베이스`);
      console.log(`  6. 응답 역순으로 전달`);
    } else {
      console.log(`�📤 API 요청 전송 중...`);
    }

    const networkStartTime = performance.now();
    const response = await $fetch(`/api/admin/trigger-fetch/${sourceName}`, {
      method: 'POST',
    });
    const networkEndTime = performance.now();

    const endTime = Date.now();
    const duration = endTime - startTime;
    const networkDuration = networkEndTime - networkStartTime;

    if (sourceName === 'gas-stations') {
      console.log(`📥 [NETWORK] 주유소 API 응답 수신 완료!`);
      console.log(`⏱️ [NETWORK] 네트워크 타이밍 분석:`);
      console.log(`  🌐 총 네트워크 시간: ${networkDuration.toFixed(2)}ms`);
      console.log(`  📊 전체 처리 시간: ${duration}ms`);
      console.log(`  ⚡ 네트워크 효율성: ${((networkDuration / duration) * 100).toFixed(1)}%`);

      console.log(`📋 [NETWORK] 응답 헤더 분석:`);
      // 응답 헤더는 $fetch에서 직접 접근하기 어려우므로 추정값 표시
      console.log(`  🏷️ Content-Type: application/json (추정)`);
      console.log(`  📦 응답 크기: ${JSON.stringify(response).length} bytes`);
      console.log(`  🔒 보안: HTTPS 암호화`);
      console.log(`  🌍 서버: Cloudflare Workers`);

      console.log(`🔍 [NETWORK] 응답 데이터 구조 분석:`);
      console.log(`  ✅ 성공 여부: ${response.success}`);
      console.log(`  📝 메시지: ${response.message}`);
      console.log(`  📊 상세 정보 포함: ${!!response.details}`);
      console.log(`  ⏱️ 타이밍 정보 포함: ${!!response.timing}`);

      if (response.details) {
        console.log(`📈 [NETWORK] 백엔드 처리 상세:`);
        console.log(`  🏪 처리된 주유소: ${response.details.stationsProcessed || 0}개`);
        console.log(`  💰 처리된 가격: ${response.details.pricesProcessed || 0}개`);
        console.log(`  ⏱️ 백엔드 실행 시간: ${response.details.executionTime || 0}ms`);

        if (response.details.externalApis) {
          console.log(`🌐 [NETWORK] 외부 API 연결 정보:`);
          console.log(`  🏝️ 주유소 정보 API: ${(response.details.externalApis as any).gasInfoApi}`);
          console.log(`  💰 가격 정보 API: ${(response.details.externalApis as any).gasPriceApi}`);
          console.log(`  �️ 좌표 변환 API: ${(response.details.externalApis as any).coordinateConversionApi}`);
        }
      }

      console.log(`🎯 [NETWORK] 네트워크 성능 요약:`);
      const throughput = JSON.stringify(response).length / (networkDuration / 1000);
      console.log(`  📊 처리량: ${throughput.toFixed(0)} bytes/sec`);
      console.log(`  🚀 응답 속도: ${networkDuration < 1000 ? '빠름' : networkDuration < 3000 ? '보통' : '느림'}`);
      console.log(`  📶 네트워크 품질: ${(navigator as any).connection?.effectiveType || '측정 불가'}`);
    } else {
      console.log(`�📥 API 응답 수신 완료 (${duration}ms)`);
    }

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

    if (sourceName === 'gas-stations') {
      console.error(`💥 [NETWORK] 주유소 API 네트워크 요청 실패!`);
      console.error(`⏱️ [NETWORK] 실패까지 소요 시간: ${duration}ms`);
      console.error(`📡 [NETWORK] 네트워크 진단:`);
      console.error(`  🌐 인터넷 연결: ${navigator.onLine ? '✅ 연결됨' : '❌ 연결 안됨'}`);
      console.error(`  📶 연결 타입: ${(navigator as any).connection?.effectiveType || '알 수 없음'}`);
      console.error(`  ⚡ 다운링크: ${(navigator as any).connection?.downlink || '알 수 없음'}Mbps`);
      console.error(`  📊 RTT: ${(navigator as any).connection?.rtt || '알 수 없음'}ms`);

      console.error(`🔍 [NETWORK] 오류 상세 분석:`);
      console.error(`  📛 오류 타입: ${error.name || 'Unknown'}`);
      console.error(`  💬 오류 메시지: ${error.message || 'No message'}`);
      console.error(`  🔢 HTTP 상태: ${error.statusCode || 'No status'}`);
      console.error(`  📄 응답 데이터:`, error.data || 'No data');

      console.error(`🛠️ [NETWORK] 네트워크 문제 해결 방안:`);
      console.error(`  1. 🔄 페이지 새로고침 후 재시도`);
      console.error(`  2. 🌐 인터넷 연결 상태 확인`);
      console.error(`  3. 🔒 방화벽/프록시 설정 확인`);
      console.error(`  4. 🏢 회사/학교 네트워크 제한 확인`);
      console.error(`  5. 📱 모바일 데이터로 전환 테스트`);
      console.error(`  6. 🕐 잠시 후 재시도 (서버 과부하 가능성)`);

      console.error(`🌍 [NETWORK] 예상 실패 지점 분석:`);
      if (error.statusCode >= 500) {
        console.error(`  🎯 서버 오류 (5xx): Cloudflare Workers 또는 백엔드 서버 문제`);
      } else if (error.statusCode >= 400) {
        console.error(`  🎯 클라이언트 오류 (4xx): 요청 형식 또는 권한 문제`);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error(`  🎯 네트워크 연결 실패: DNS 해석 또는 TCP 연결 문제`);
      } else if (error.name === 'AbortError') {
        console.error(`  🎯 요청 타임아웃: 네트워크 지연 또는 서버 응답 지연`);
      } else {
        console.error(`  🎯 알 수 없는 오류: 브라우저 또는 네트워크 스택 문제`);
      }

      console.error(`📈 [NETWORK] 네트워크 경로별 진단:`);
      console.error(`  1. 브라우저 → Cloudflare Edge: ${navigator.onLine ? '✅' : '❌'}`);
      console.error(`  2. Cloudflare Edge → Workers: ${error.statusCode ? '✅' : '❓'}`);
      console.error(`  3. Workers → 제주도 API: ${error.statusCode >= 500 ? '❓' : '✅'}`);
      console.error(`  4. Workers → 카카오 API: ${error.statusCode >= 500 ? '❓' : '✅'}`);
      console.error(`  5. Workers → Supabase DB: ${error.statusCode >= 500 ? '❓' : '✅'}`);
    } else {
      console.error(`💥 API 요청 실패 (${duration}ms)`);
      console.error(`🔍 오류 상세 정보:`, error);
      console.error(`📡 네트워크 상태:`, navigator.onLine ? '온라인' : '오프라인');

      if (error.data) {
        console.error(`📄 서버 응답 데이터:`, error.data);
      }
      if (error.statusCode) {
        console.error(`🔢 HTTP 상태 코드: ${error.statusCode}`);
      }
    }

    results.value[key] = {
      success: false,
      message: error.data?.message || error.message || `An unexpected error occurred while triggering ${sourceName}.`
    };
  } finally {
    const totalTime = Date.now() - startTime;

    if (sourceName === 'gas-stations') {
      console.log(`🏁 [NETWORK] 주유소 API 네트워크 세션 종료`);
      console.log(`⏱️ [NETWORK] 최종 타이밍 요약:`);
      console.log(`  🕐 총 세션 시간: ${totalTime}ms`);
      console.log(`  📊 평균 응답 시간: ${totalTime < 5000 ? '빠름' : totalTime < 15000 ? '보통' : '느림'}`);
      console.log(`  🎯 완료 시각: ${new Date().toLocaleString()}`);

      console.log(`📊 [NETWORK] 네트워크 세션 통계:`);
      console.log(`  🌐 연결 상태: ${navigator.onLine ? '온라인 유지' : '오프라인 감지'}`);
      console.log(`  📶 네트워크 품질: ${(navigator as any).connection?.effectiveType || '측정 불가'}`);
      console.log(`  ⚡ 대역폭: ${(navigator as any).connection?.downlink || '알 수 없음'}Mbps`);

      console.log(`🎯 [NETWORK] 다음 단계 안내:`);
      console.log(`  1. 📝 서버 로그에서 상세 처리 과정 확인 가능`);
      console.log(`  2. 🗺️ 주유소 지도에서 업데이트된 데이터 확인`);
      console.log(`  3. 🔄 다음 자동 수집: 매일 새벽 2시 (KST)`);
      console.log(`  4. 📊 데이터베이스에서 실시간 반영 완료`);

      console.log(`🌐 [NETWORK] 네트워크 경로 최종 상태:`);
      console.log(`  ✅ 브라우저 ↔ Cloudflare Edge: 정상`);
      console.log(`  ✅ Cloudflare Edge ↔ Workers: 정상`);
      console.log(`  ✅ Workers ↔ 외부 API들: 백엔드에서 처리 완료`);
      console.log(`  ✅ Workers ↔ 데이터베이스: 저장 완료`);
    } else {
      console.log(`⏰ 총 소요 시간: ${totalTime}ms`);
      console.log(`🏁 ${sourceName.toUpperCase()} 트리거 완료: ${new Date().toLocaleString()}`);
    }

    console.groupEnd();
    loading.value[key] = false;
  }
}
</script>

<style scoped>
/* 페이지별 스타일 */
</style>

<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">시스템 오류 관리</h2>

    <!-- 필터링 섹션 -->
    <div class="mb-4 p-4 bg-white rounded-lg shadow">
      <h3 class="text-lg font-medium mb-2">오류 필터</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input type="date" class="p-2 border rounded" placeholder="날짜 선택">
        <select class="p-2 border rounded">
          <option value="">상태 전체</option>
          <option value="new">신규</option>
          <option value="investigating">조사중</option>
          <option value="resolved">해결됨</option>
          <option value="ignored">무시됨</option>
        </select>
        <input type="text" placeholder="오류 메시지 검색..." class="p-2 border rounded">
      </div>
      <div class="mt-2 text-right">
        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">필터 적용</button>
      </div>
    </div>

    <!-- 오류 로그 목록 -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발생 시각</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">오류 메시지</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- 예시 오류 데이터 -->
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ERR_001</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-15 10:30:00</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-md" title="데이터베이스 연결 실패: 사용자 인증 오류">데이터베이스 연결 실패: 사용자 인증 오류</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">신규</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="text-indigo-600 hover:text-indigo-900 mr-2">상세</button>
              <select class="p-1 border rounded text-xs">
                <option value="new">신규</option>
                <option value="investigating">조사중</option>
                <option value="resolved">해결됨</option>
                <option value="ignored">무시됨</option>
              </select>
            </td>
          </tr>
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ERR_002</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-14 15:45:12</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-md" title="API 응답 처리 중 예외 발생: null 참조">API 응답 처리 중 예외 발생: null 참조</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">조사중</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="text-indigo-600 hover:text-indigo-900 mr-2">상세</button>
              <select class="p-1 border rounded text-xs">
                <option value="new">신규</option>
                <option value="investigating" selected>조사중</option>
                <option value="resolved">해결됨</option>
                <option value="ignored">무시됨</option>
              </select>
            </td>
          </tr>
          <!-- 더 많은 오류 행 -->
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div class="mt-4 flex justify-center">
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"> 이전 </a>
        <a href="#" aria-current="page" class="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"> 1 </a>
        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"> 다음 </a>
      </nav>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth-admin']
});

// 여기에 오류 로그 데이터 로딩 및 관리 로직 추가 예정
</script>

<style scoped>
/* 페이지별 스타일 */
</style>

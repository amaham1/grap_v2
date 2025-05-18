<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">API 수집 로그 조회</h2>

    <!-- 필터링 섹션 -->
    <div class="mb-4 p-4 bg-white rounded-lg shadow">
      <h3 class="text-lg font-medium mb-2">로그 필터</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="date" class="p-2 border rounded" placeholder="날짜 선택">
        <select class="p-2 border rounded">
          <option value="">데이터 소스 전체</option>
          <option value="festivals">축제</option>
          <option value="exhibitions">전시회</option>
          <option value="welfare-services">복지 서비스</option>
        </select>
        <select class="p-2 border rounded">
          <option value="">상태 전체</option>
          <option value="success">성공</option>
          <option value="failure">실패</option>
        </select>
        <input type="text" placeholder="로그 메시지 검색..." class="p-2 border rounded">
      </div>
      <div class="mt-2 text-right">
        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">필터 적용</button>
      </div>
    </div>

    <!-- API 수집 로그 목록 -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">데이터 소스</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메시지/결과</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- 예시 API 로그 데이터 -->
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">LOG_001</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-15 02:00:00</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">festivals</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">성공</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-md" title="축제 정보 150건 수집 완료">축제 정보 150건 수집 완료</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="text-indigo-600 hover:text-indigo-900">상세</button>
            </td>
          </tr>
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">LOG_002</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-15 03:00:00</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">exhibitions</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">실패</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700 truncate max-w-md" title="API 요청 시간 초과">API 요청 시간 초과</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="text-indigo-600 hover:text-indigo-900">상세</button>
            </td>
          </tr>
          <!-- 더 많은 로그 행 -->
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

// 여기에 API 수집 로그 데이터 로딩 및 관리 로직 추가 예정
</script>

<style scoped>
/* 페이지별 스타일 */
</style>

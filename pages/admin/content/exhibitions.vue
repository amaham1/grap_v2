<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">전시회 관리</h2>

    <!-- 검색 및 필터 -->
    <div class="mb-4 p-4 bg-white rounded-lg shadow">
      <h3 class="text-lg font-medium mb-2">검색 및 필터</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input type="text" placeholder="제목 검색..." class="p-2 border rounded">
        <select class="p-2 border rounded">
          <option value="">노출 상태 전체</option>
          <option value="true">노출</option>
          <option value="false">숨김</option>
        </select>
        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">검색</button>
      </div>
    </div>

    <!-- 콘텐츠 목록 -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">장소</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노출 상태</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- 예시 데이터 -->
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">EXHB_001</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">멋진 전시회</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">국립현대미술관</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">노출</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="text-indigo-600 hover:text-indigo-900 mr-2">상세</button>
              <button class="text-red-600 hover:text-red-900">숨김</button>
            </td>
          </tr>
          <!-- 더 많은 데이터 행 -->
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

// 여기에 전시회 데이터 로딩 및 관리 로직 추가 예정
</script>

<style scoped>
/* 페이지별 스타일 */
</style>

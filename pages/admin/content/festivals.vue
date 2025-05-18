<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">축제 관리</h2>

    <!-- Toast Message -->
    <div v-if="toast" 
         :class="toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'" 
         class="fixed top-20 right-5 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between min-w-[300px]">
      <span>{{ toast.message }}</span>
      <button @click="dismissToast" class="ml-4 text-xl font-semibold">&times;</button>
    </div>

    <!-- 검색 및 필터 -->
    <div class="mb-6 p-4 bg-white rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-3">검색 및 필터</h3>
      <div class="flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          v-model="searchQuery" 
          @keyup.enter="handleSearch"
          placeholder="축제명 검색..." 
          class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 flex-grow md:w-auto"
        >
        <select 
          v-model="filterStatus" 
          @change="handleFilterChange" 
          class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 md:w-auto"
        >
          <option value="">노출 상태 (전체)</option>
          <option value="true">노출</option>
          <option value="false">숨김</option>
        </select>
        <button 
          @click="handleSearch" 
          class="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          검색
        </button>
      </div>
    </div>
    <!-- 콘텐츠 목록 -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-100">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">제목</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">지역</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">기간</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">노출 상태</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">등록일</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading">
            <td colspan="7" class="py-6 px-6 text-center text-gray-500">
              <div class="flex justify-center items-center">
                <svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                데이터를 불러오는 중입니다...
              </div>
            </td>
          </tr>
          <tr v-else-if="!loading && festivals.length === 0">
            <td colspan="7" class="py-6 px-6 text-center text-gray-500">
              표시할 축제 정보가 없습니다. 검색 조건을 확인하거나 필터를 조정해 보세요.
            </td>
          </tr>
          <tr v-else v-for="festival in festivals" :key="festival.id" class="hover:bg-gray-50 transition-colors duration-150">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ festival.original_api_id || festival.id }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ festival.title }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ festival.region || 'N/A' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ festival.start_date || '미지정' }} ~ {{ festival.end_date || '미지정' }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="festival.is_show ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 text-xs font-semibold rounded-full">
                {{ festival.is_show ? '노출' : '숨김' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ new Date(festival.created_at).toLocaleDateString() }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button @click="viewDetails(festival)" class="text-indigo-600 hover:text-indigo-800 transition-colors duration-150">상세</button>
              <button @click="toggleVisibility(festival)" 
                      :class="festival.is_show ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'" 
                      class="transition-colors duration-150">
                {{ festival.is_show ? '숨김' : '노출' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 0" class="mt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-700">
      <span class="mb-2 md:mb-0">
        총 {{ totalItems }}개 중 {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, totalItems) }}개 표시 (페이지: {{ currentPage }}/{{ totalPages }})
      </span>
      <nav>
        <ul class="inline-flex items-center -space-x-px">
          <li>
            <button @click="changePage(1)" :disabled="currentPage === 1" 
                    class="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
              &laquo;&laquo;
            </button>
          </li>
          <li>
            <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" 
                    class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
              &laquo;
            </button>
          </li>
          <!-- 페이지 번호들 -->
          <li v-for="pageNumber in visiblePageNumbers" :key="pageNumber">
            <button @click="changePage(pageNumber)" 
                    :class="{'z-10 px-3 py-2 leading-tight text-indigo-600 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700': currentPage === pageNumber, 
                             'px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700': currentPage !== pageNumber}">
              {{ pageNumber }}
            </button>
          </li>
          <li>
            <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages || totalPages === 0" 
                    class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
              &raquo;
            </button>
          </li>
          <li>
            <button @click="changePage(totalPages)" :disabled="currentPage === totalPages || totalPages === 0" 
                    class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
              &raquo;&raquo;
            </button>
          </li>
        </ul>
      </nav>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Festival } from '~/server/types/entities';

definePageMeta({
  layout: 'admin',
  middleware: ['auth-admin']
});

const festivals = ref<Festival[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const filterStatus = ref(''); // '', 'true', 'false'
const currentPage = ref(1);
const itemsPerPage = ref(10); 
const totalItems = ref(0);

const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value);
});

// 페이지네이션에 표시될 페이지 번호들 계산
const visiblePageNumbers = computed(() => {
  const maxVisiblePages = 5; // 한 번에 표시할 최대 페이지 수 (현재 페이지 양쪽으로)
  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }
  
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

async function fetchFestivals() {
  loading.value = true;
  toast.value = null;
  try {
    const params = new URLSearchParams();
    params.append('page', currentPage.value.toString());
    params.append('limit', itemsPerPage.value.toString());
    if (searchQuery.value.trim()) {
      params.append('searchQuery', searchQuery.value.trim());
    }
    if (filterStatus.value) {
      params.append('filterStatus', filterStatus.value);
    }

    const response = await $fetch(`/api/admin/festivals?${params.toString()}`, {
      method: 'GET',
      // @ts-ignore Nuxt $fetch는 자동으로 JSON을 파싱합니다.
      headers: { 'Accept': 'application/json' }, 
    });
    
    // @ts-ignore
    festivals.value = response.data as Festival[];
    // @ts-ignore
    totalItems.value = response.meta.total;
    // @ts-ignore
    currentPage.value = response.meta.page;

  } catch (error: any) {
    console.error('Error fetching festivals:', error);
    festivals.value = [];
    totalItems.value = 0;
    // Nuxt/Nitro에서 오류 응답은 error.data에 포함될 수 있습니다.
    toast.value = { message: error.data?.statusMessage || error.data?.message || '축제 정보를 불러오는데 실패했습니다.', type: 'error' };
  } finally {
    loading.value = false;
  }
}

async function toggleVisibility(festival: Festival) {
  toast.value = null;
  try {
    const response = await $fetch(`/api/admin/festivals/${festival.id}/toggle`, {
      method: 'POST',
      // @ts-ignore
      headers: { 'Accept': 'application/json' }, 
    });

    // @ts-ignore
    if (response.success) {
      const index = festivals.value.findIndex(f => f.id === festival.id);
      if (index !== -1) {
        // @ts-ignore
        festivals.value[index].is_show = response.newIsShow;
      }
      // @ts-ignore
      toast.value = { message: response.message || '상태가 성공적으로 변경되었습니다.', type: 'success' };
    } else {
      // @ts-ignore
      toast.value = { message: response.message || '상태 변경에 실패했습니다.', type: 'error' };
      await fetchFestivals(); // 데이터 일관성을 위해 목록 새로고침
    }
  } catch (error: any) {
    console.error('Error toggling visibility:', error);
    toast.value = { message: error.data?.statusMessage || error.data?.message || '상태 변경 중 오류가 발생했습니다.', type: 'error' };
    await fetchFestivals(); // 데이터 일관성을 위해 목록 새로고침
  }
}

function viewDetails(festival: Festival) {
  console.log('View details for festival:', festival.id);
  alert(`상세보기 기능은 아직 구현되지 않았습니다. 축제 ID: ${festival.id}`);
  // 실제 구현 시: await navigateTo(`/admin/content/festivals/${festival.id}`);
}

function handleSearch() {
  currentPage.value = 1; 
  fetchFestivals();
}

function handleFilterChange() {
  currentPage.value = 1; 
  fetchFestivals();
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    fetchFestivals();
  }
}

// 검색어나 필터 값 변경 시 즉시 데이터를 가져오고 싶다면 watch 사용
// watch([searchQuery, filterStatus], () => {
//   currentPage.value = 1;
//   fetchFestivals();
// });

onMounted(() => {
  fetchFestivals();
});

function dismissToast() {
  toast.value = null;
}

</script>

<style scoped>
/* 페이지별 스타일 추가 가능 */
.disabled\:cursor-not-allowed {
  cursor: not-allowed;
}
</style>

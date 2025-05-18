<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">복지 서비스 관리</h2>

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
          placeholder="서비스명 검색..."
          class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 flex-grow md:w-auto"
        >
        <select
          v-model="filterIsExposed"
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
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">API ID</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">서비스명</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">대상</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">노출 상태</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">데이터 수집일</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
              <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-2">데이터를 불러오는 중입니다...</p>
            </td>
          </tr>
          <tr v-else-if="!loading && welfareServices.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
              <div class="flex flex-col items-center">
                <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>검색 결과가 없습니다.</span>
                <p class="text-sm text-gray-400 mt-1">다른 검색어나 필터를 사용해 보세요.</p>
              </div>
            </td>
          </tr>
          <tr v-else v-for="service in welfareServices" :key="service.id" class="hover:bg-gray-50 transition-colors duration-150">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ service.original_api_id || service.id }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ service.service_name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" v-html="service.support_target_html || 'N/A'"></td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="service.is_exposed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 text-xs font-semibold rounded-full">
                {{ service.is_exposed ? '노출' : '숨김' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ service.fetched_at ? new Date(service.fetched_at).toLocaleDateString() : 'N/A' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button @click="viewDetails(service)" class="text-indigo-600 hover:text-indigo-800 transition-colors duration-150">상세</button>
              <button @click="toggleVisibility(service)"
                      :class="service.is_exposed ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'"
                      class="transition-colors duration-150">
                {{ service.is_exposed ? '숨김' : '노출' }}
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

    <!-- 상세 정보 모달 -->
    <div v-if="selectedWelfareService" class="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">복지 서비스 상세 정보</h3>
          <button @click="closeDetailsModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div class="space-y-3 text-sm">
          <p><strong>ID (DB):</strong> {{ selectedWelfareService.id }}</p>
          <p><strong>API Original ID:</strong> {{ selectedWelfareService.original_api_id || 'N/A' }}</p>
          <p><strong>서비스명:</strong> {{ selectedWelfareService.service_name }}</p>
          <p><strong>대상:</strong> <span v-html="selectedWelfareService.support_target_html || 'N/A'"></span></p>
          <p><strong>서비스 내용:</strong></p>
          <pre class="bg-gray-100 p-3 rounded-md text-xs whitespace-pre-wrap">{{ selectedWelfareService.service_content || 'N/A' }}</pre>
          <p><strong>신청 링크:</strong> 
            <a v-if="selectedWelfareService.application_link" :href="selectedWelfareService.application_link" target="_blank" class="text-indigo-600 hover:underline">[링크 바로가기]</a>
            <span v-else>N/A</span>
          </p>
          <p><strong>연락처:</strong> {{ selectedWelfareService.contact_info || 'N/A' }}</p>
          <p><strong>담당 부서:</strong> {{ selectedWelfareService.department_name || 'N/A' }}</p>
          <p><strong>노출 여부:</strong>
            <label class="inline-flex items-center">
              <input type="checkbox" v-model="editableIsExposed" class="form-checkbox h-5 w-5 text-indigo-600">
              <span class="ml-2">{{ editableIsExposed ? '노출' : '숨김' }}</span>
            </label>
          </p>
          <p><strong>관리자 메모:</strong></p>
          <textarea v-model="editableAdminMemo" rows="3" class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          <p><strong>데이터 수집 시각:</strong> {{ selectedWelfareService.fetched_at ? new Date(selectedWelfareService.fetched_at).toLocaleString() : 'N/A' }}</p>
          <p><strong>생성 시각:</strong> {{ selectedWelfareService.created_at ? new Date(selectedWelfareService.created_at).toLocaleString() : 'N/A' }}</p>
          <p><strong>마지막 업데이트 시각:</strong> {{ selectedWelfareService.updated_at ? new Date(selectedWelfareService.updated_at).toLocaleString() : 'N/A' }}</p>
          <p><strong>API 원본 데이터:</strong></p>
          <pre class="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-60">{{ selectedWelfareService.api_raw_data ? JSON.stringify(JSON.parse(selectedWelfareService.api_raw_data), null, 2) : '{}' }}</pre>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button @click="saveDetails" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">저장</button>
          <button @click="closeDetailsModal" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">닫기</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { WelfareService as ServerWelfareService } from '~/server/utils/dao/welfare-service-dao';

interface WelfareService extends ServerWelfareService {}

const welfareServices = ref<WelfareService[]>([]);
const selectedWelfareService = ref<WelfareService | null>(null);
const editableIsExposed = ref(false);
const editableAdminMemo = ref('');

const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(10); // 한 페이지에 표시할 항목 수
const totalItems = ref(0);

const searchQuery = ref('');
const filterIsExposed = ref<string>(''); // 'true', 'false', or ''

const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);

const showToast = (message: string, type: 'success' | 'error') => {
  toast.value = { message, type };
  setTimeout(() => {
    toast.value = null;
  }, 3000);
};

const dismissToast = () => {
  toast.value = null;
};

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));

const PAGINATION_RANGE_DISPLAY = 5; // 한 번에 표시할 페이지 번호 개수

const visiblePageNumbers = computed(() => {
  if (totalPages.value === 0) return [];
  const halfRange = Math.floor((PAGINATION_RANGE_DISPLAY -1) / 2);
  let start = Math.max(1, currentPage.value - halfRange);
  let end = Math.min(totalPages.value, currentPage.value + halfRange);

  if (totalPages.value < PAGINATION_RANGE_DISPLAY) {
    start = 1;
    end = totalPages.value;
  } else if (currentPage.value <= halfRange) {
    end = PAGINATION_RANGE_DISPLAY;
  } else if (currentPage.value + halfRange >= totalPages.value) {
    start = totalPages.value - PAGINATION_RANGE_DISPLAY + 1;
  }
  
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const fetchWelfareServices = async () => {
  loading.value = true; // 함수 시작 시 로딩 상태로 설정

  const params: Record<string, any> = {
    page: currentPage.value,
    limit: itemsPerPage.value,
    searchQuery: searchQuery.value,
  };
  if (filterIsExposed.value) {
    params.isExposed = filterIsExposed.value;
  }

  // @ts-ignore: useFetch has known issues with dynamic params typing in Nuxt 3
  const { data: response, error } = await useFetch('/api/admin/welfare-services', {
    method: 'GET',
    params,
    headers: useRequestHeaders(['cookie']),
  });

  if (error.value) {
    console.error('API Error:', error.value);
    welfareServices.value = [];
    totalItems.value = 0;
    // @ts-ignore
    showToast(error.value.data?.message || error.value.message || '데이터 로딩 중 에러 발생', 'error');
  } else if (response.value) {
    console.log('API Response:', response.value);
    if (response.value.success) {
      // @ts-ignore
      welfareServices.value = response.value.data || [];
      // @ts-ignore
      totalItems.value = response.value.meta.total || 0;
    } else {
      // @ts-ignore
      showToast(response.value?.message || '데이터 로딩 실패', 'error');
      welfareServices.value = [];
      totalItems.value = 0;
    }
  } else {
    // 응답이 null이고 에러도 없는 경우 (예: 204 No Content 또는 네트워크 문제)
    console.warn('API Response is null and no error reported');
    // @ts-ignore
    showToast('서버로부터 응답이 없거나 데이터가 없습니다.', 'warn');
    welfareServices.value = [];
    totalItems.value = 0;
  }
  loading.value = false; // 모든 처리 후 로딩 상태 해제
};

const handleSearch = () => {
  currentPage.value = 1; // 검색 시 첫 페이지로 이동
  fetchWelfareServices();
};

const handleFilterChange = () => {
  currentPage.value = 1; // 필터 변경 시 첫 페이지로 이동
  fetchWelfareServices();
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const toggleVisibility = async (service: WelfareService) => {
  if (!service || typeof service.id === 'undefined') {
    showToast('잘못된 서비스 정보입니다.', 'error');
    return;
  }
  try {
    const newIsExposed = !service.is_exposed;
    const { data: response, error } = await useFetch(`/api/admin/welfare-services/${service.id}`,
    {
      method: 'PUT',
      body: { is_exposed: newIsExposed },
      headers: useRequestHeaders(['cookie']),
    });

    if (error.value) throw error.value;

    if (response.value && response.value.success) {
      // @ts-ignore
      const index = welfareServices.value.findIndex(ws => ws.id === service.id);
      if (index !== -1) {
        // @ts-ignore
        welfareServices.value[index].is_exposed = newIsExposed;
        // @ts-ignore
        welfareServices.value[index].updated_at = new Date().toISOString();
      }
      showToast(`서비스가 성공적으로 ${newIsExposed ? '노출' : '숨김'} 처리되었습니다.`, 'success');
    } else {
      // @ts-ignore
      showToast(response.value?.message || '상태 변경 실패', 'error');
    }
  } catch (err: any) {
    console.error('Error toggling visibility:', err);
    showToast(err.data?.message || '상태 변경 중 오류 발생', 'error');
  }
};

const viewDetails = (service: WelfareService) => {
  selectedWelfareService.value = { ...service };
  editableIsExposed.value = service.is_exposed ?? false;
  editableAdminMemo.value = service.admin_memo || '';
};

const closeDetailsModal = () => {
  selectedWelfareService.value = null;
};

const saveDetails = async () => {
  if (!selectedWelfareService.value || typeof selectedWelfareService.value.id === 'undefined') {
    showToast('저장할 서비스 정보가 없습니다.', 'error');
    return;
  }
  try {
    const payload: Partial<WelfareService> = {
      is_exposed: editableIsExposed.value,
      admin_memo: editableAdminMemo.value,
    };
    // Prevent sending other fields that shouldn't be updated here
    // The backend should also enforce this, but good practice for frontend too.

    const { data: response, error } = await useFetch(`/api/admin/welfare-services/${selectedWelfareService.value.id}`,
    {
      method: 'PUT',
      body: payload,
      headers: useRequestHeaders(['cookie']),
    });

    if (error.value) throw error.value;

    if (response.value && response.value.success) {
      // @ts-ignore
      const index = welfareServices.value.findIndex(ws => ws.id === selectedWelfareService.value!.id);
      if (index !== -1) {
        // @ts-ignore
        welfareServices.value[index].is_exposed = editableIsExposed.value;
        // @ts-ignore
        welfareServices.value[index].admin_memo = editableAdminMemo.value;
        // @ts-ignore
        welfareServices.value[index].updated_at = new Date().toISOString(); 
      }
      showToast('서비스 정보가 성공적으로 저장되었습니다.', 'success');
      closeDetailsModal();
    } else {
      // @ts-ignore
      showToast(response.value?.message || '저장 실패', 'error');
    }
  } catch (err: any) {
    console.error('Error saving details:', err);
    showToast(err.data?.message || '저장 중 오류 발생', 'error');
  }
};

watch([currentPage, searchQuery, filterIsExposed], () => {
  fetchWelfareServices();
}, { immediate: true });

onMounted(() => {
  // fetchWelfareServices();
});

definePageMeta({
  layout: 'admin',
  middleware: ['auth-admin']
});

</script>

<style scoped>
/* 페이지별 스타일 */
</style>

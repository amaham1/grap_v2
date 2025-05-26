<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6">전시 관리</h2>

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
          placeholder="전시명 검색..."
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
         <input
          type="text"
          v-model="filterCategoryName"
          @keyup.enter="handleSearch"
          placeholder="카테고리명 검색..."
          class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 md:w-auto"
        >
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
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">제목</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">카테고리</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">기간</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">노출 상태</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">데이터 수집일</th>
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
          <tr v-else-if="!loading && exhibitions.length === 0">
            <td colspan="7" class="py-6 px-6 text-center text-gray-500">
              표시할 전시 정보가 없습니다. 검색 조건을 확인하거나 필터를 조정해 보세요.
            </td>
          </tr>
          <tr v-else v-for="exhibition in exhibitions" :key="exhibition.id" class="hover:bg-gray-50 transition-colors duration-150">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ exhibition.original_api_id || exhibition.id }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ exhibition.title }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ exhibition.category_name || 'N/A' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ exhibition.start_date ? new Date(exhibition.start_date).toLocaleDateString() : '미지정' }} ~ {{ exhibition.end_date ? new Date(exhibition.end_date).toLocaleDateString() : '미지정' }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="exhibition.is_exposed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 text-xs font-semibold rounded-full">
                {{ exhibition.is_exposed ? '노출' : '숨김' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ exhibition.fetched_at ? new Date(exhibition.fetched_at).toLocaleDateString() : 'N/A' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button @click="viewDetails(exhibition)" class="text-indigo-600 hover:text-indigo-800 transition-colors duration-150">상세</button>
              <button @click="toggleVisibility(exhibition)"
                      :class="exhibition.is_exposed ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'"
                      class="transition-colors duration-150">
                {{ exhibition.is_exposed ? '숨김' : '노출' }}
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
    <div v-if="selectedExhibition" class="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">전시 상세 정보</h3>
          <button @click="closeDetailsModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div class="space-y-3 text-sm">
          <p><strong>ID (DB):</strong> {{ selectedExhibition.id }}</p>
          <p><strong>API Original ID:</strong> {{ selectedExhibition.original_api_id || 'N/A' }}</p>
          <p><strong>제목:</strong> {{ selectedExhibition.title }}</p>
          <p><strong>카테고리:</strong> {{ selectedExhibition.category_name || 'N/A' }}</p>
          <p><strong>커버 이미지:</strong>
            <a v-if="selectedExhibition.cover_image_url" :href="selectedExhibition.cover_image_url" target="_blank" class="text-indigo-600 hover:underline">[이미지 링크]</a>
            <img v-if="selectedExhibition.cover_image_url" :src="selectedExhibition.cover_image_url" alt="Cover Image" class="mt-1 max-w-xs max-h-48 object-contain border rounded">
            <span v-else>N/A</span>
          </p>
          <p><strong>시작일:</strong> {{ selectedExhibition.start_date ? new Date(selectedExhibition.start_date).toLocaleString() : 'N/A' }}</p>
          <p><strong>종료일:</strong> {{ selectedExhibition.end_date ? new Date(selectedExhibition.end_date).toLocaleString() : 'N/A' }}</p>
          <p><strong>시간 정보:</strong> {{ selectedExhibition.time_info || 'N/A' }}</p>
          <p><strong>요금 정보:</strong> <span v-html="selectedExhibition.pay_info ? selectedExhibition.pay_info.replace(/\n/g, '<br>') : 'N/A'"></span></p>
          <p><strong>장소:</strong> {{ selectedExhibition.location_name || 'N/A' }}</p>
          <p><strong>주최:</strong> {{ selectedExhibition.organizer_info || 'N/A' }}</p>
          <p><strong>연락처:</strong> {{ selectedExhibition.tel_number || 'N/A' }}</p>
          <p><strong>상태 정보:</strong> {{ selectedExhibition.status_info || 'N/A' }}</p>
          <p><strong>구분:</strong> {{ selectedExhibition.division_name || 'N/A' }}</p>
          <p><strong>노출 여부:</strong>
            <label class="inline-flex items-center">
              <input type="checkbox" v-model="editableIsExposed" class="form-checkbox h-5 w-5 text-indigo-600">
              <span class="ml-2">{{ editableIsExposed ? '노출' : '숨김' }}</span>
            </label>
          </p>
          <p><strong>관리자 메모:</strong></p>
          <textarea v-model="editableAdminMemo" rows="3" class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          <p><strong>데이터 수집 시각:</strong> {{ selectedExhibition.fetched_at ? new Date(selectedExhibition.fetched_at).toLocaleString() : 'N/A' }}</p>
          <p><strong>생성 시각:</strong> {{ selectedExhibition.created_at ? new Date(selectedExhibition.created_at).toLocaleString() : 'N/A' }}</p>
          <p><strong>마지막 업데이트 시각:</strong> {{ selectedExhibition.updated_at ? new Date(selectedExhibition.updated_at).toLocaleString() : 'N/A' }}</p>
          <p><strong>API 원본 데이터:</strong></p>
          <pre class="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-60">{{ selectedExhibition.api_raw_data ? JSON.stringify(JSON.parse(selectedExhibition.api_raw_data), null, 2) : '{}' }}</pre>
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
import type { Exhibition as ServerExhibition } from '~/server/dao/supabase/exhibition-dao'; // Import server type for reference

// Frontend type, can be same as server or adapted
interface Exhibition extends ServerExhibition {}

definePageMeta({
  layout: 'admin',
  middleware: ['auth-admin']
});

const exhibitions = ref<Exhibition[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const filterIsExposed = ref(''); // '', 'true', 'false'
const filterCategoryName = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const selectedExhibition = ref<Exhibition | null>(null);
const editableAdminMemo = ref('');
const editableIsExposed = ref(false);

const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);

const totalPages = computed(() => {
  if (totalItems.value === 0) return 0;
  return Math.ceil(totalItems.value / itemsPerPage.value);
});

const visiblePageNumbers = computed(() => {
  if (totalPages.value === 0) return [];
  const maxVisiblePages = 5;
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

async function fetchExhibitions() {
  loading.value = true;
  toast.value = null;
  try {
    const params = new URLSearchParams();
    params.append('page', currentPage.value.toString());
    params.append('limit', itemsPerPage.value.toString());
    if (searchQuery.value.trim()) {
      params.append('searchTerm', searchQuery.value.trim());
    }
    if (filterIsExposed.value) {
      params.append('isExposed', filterIsExposed.value);
    }
    if (filterCategoryName.value.trim()) {
      params.append('categoryName', filterCategoryName.value.trim());
    }

    // @ts-ignore Nuxt $fetch handles response type
    const response = await $fetch(`/api/admin/exhibitions?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (response.data && response.meta) {
      exhibitions.value = response.data as Exhibition[];
      totalItems.value = response.meta.total;
      // Ensure currentPage is not out of bounds after fetching
      if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value;
      }
    } else {
      exhibitions.value = [];
      totalItems.value = 0;
      showToast('전시 데이터 형식이 올바르지 않습니다.', 'error');
    }

  } catch (error: any) {
    console.error('Error fetching exhibitions:', error);
    exhibitions.value = [];
    totalItems.value = 0;
    showToast(error.data?.message || error.message || '전시 정보를 불러오는 데 실패했습니다.', 'error');
  } finally {
    loading.value = false;
  }
}

async function toggleVisibility(exhibition: Exhibition) {
  const newStatus = !exhibition.is_exposed;
  try {
    // @ts-ignore
    const response = await $fetch(`/api/admin/exhibitions/${exhibition.id}`, {
      method: 'PUT',
      body: { is_exposed: newStatus },
    });

    if (response.data) {
      const index = exhibitions.value.findIndex(f => f.id === exhibition.id);
      if (index !== -1) {
        exhibitions.value[index] = response.data as Exhibition;
      }
      showToast(`'${response.data.title}'의 노출 상태가 ${newStatus ? '노출' : '숨김'}으로 변경되었습니다.`, 'success');
    } else {
       showToast('전시 상태 업데이트에 실패했습니다 (응답 데이터 없음).', 'error');
    }
  } catch (error: any) {
    console.error('Error toggling exhibition visibility:', error);
    showToast(error.data?.message || error.message || '전시 상태 변경 중 오류가 발생했습니다.', 'error');
  }
}

async function saveDetails() {
  if (!selectedExhibition.value || !selectedExhibition.value.id) return;

  const payload: Partial<Exhibition> = {};
  let changed = false;

  if (selectedExhibition.value.admin_memo !== editableAdminMemo.value) {
    payload.admin_memo = editableAdminMemo.value;
    changed = true;
  }
  if (selectedExhibition.value.is_exposed !== editableIsExposed.value) {
    payload.is_exposed = editableIsExposed.value;
    changed = true;
  }

  if (!changed) {
    closeDetailsModal();
    showToast('변경 사항이 없습니다.', 'success'); // Or 'info' type
    return;
  }

  try {
    // @ts-ignore
    const response = await $fetch(`/api/admin/exhibitions/${selectedExhibition.value.id}`, {
      method: 'PUT',
      body: payload,
    });

    if (response.data) {
      const updatedData = response.data as Exhibition;
      const index = exhibitions.value.findIndex(f => f.id === updatedData.id);
      if (index !== -1) {
        exhibitions.value[index] = updatedData;
      }
      selectedExhibition.value = { ...selectedExhibition.value, ...updatedData }; // Keep modal updated if not closing immediately
      showToast('정보가 업데이트되었습니다.', 'success');
      closeDetailsModal(); // Close modal on successful save
    } else {
      showToast('정보 업데이트에 실패했습니다 (응답 데이터 없음).', 'error');
    }
  } catch (error: any) {
    console.error('Error saving exhibition details:', error);
    showToast(error.data?.message || error.message || '정보 업데이트 중 오류 발생.', 'error');
  }
}

function viewDetails(exhibition: Exhibition) {
  selectedExhibition.value = JSON.parse(JSON.stringify(exhibition)); // Deep copy
  editableAdminMemo.value = selectedExhibition.value?.admin_memo || '';
  editableIsExposed.value = selectedExhibition.value?.is_exposed || false;
}

function closeDetailsModal() {
  selectedExhibition.value = null;
  editableAdminMemo.value = '';
  editableIsExposed.value = false;
}

function handleSearch() {
  currentPage.value = 1;
  fetchExhibitions();
}

function handleFilterChange() {
  currentPage.value = 1;
  fetchExhibitions();
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    // fetchExhibitions(); // Covered by watch(currentPage)
  }
}

function showToast(message: string, type: 'success' | 'error') {
  toast.value = { message, type };
  setTimeout(() => {
    toast.value = null;
  }, 3000);
}

function dismissToast() {
  toast.value = null;
}

onMounted(() => {
  fetchExhibitions();
});

watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage && newPage >= 1) { // Ensure newPage is valid
    fetchExhibitions();
  }
});

</script>

<style scoped>
/* Basic styling for modal to ensure it's scrollable */
.max-h-[90vh] {
  max-height: 90vh;
}
.form-checkbox {
  appearance: none;
  padding: 0;
  print-color-adjust: exact;
  display: inline-block;
  vertical-align: middle;
  background-origin: border-box;
  user-select: none;
  flex-shrink: 0;
  height: 1rem;
  width: 1rem;
  color: #4f46e5; /* indigo-600 */
  background-color: #fff;
  border-color: #6b7280; /* gray-500 */
  border-width: 1px;
  border-radius: 0.25rem;
}
.form-checkbox:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}
</style>

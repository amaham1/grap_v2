<template>
  <div>
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-gray-900">새 축제 등록</h2>
        <button
          @click="goBack"
          class="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          목록으로 돌아가기
        </button>
      </div>
      <p class="mt-2 text-sm text-gray-600">
        새로운 축제 정보를 등록합니다. 필수 항목을 모두 입력해주세요.
      </p>
    </div>

    <!-- Toast Message -->
    <div v-if="toast"
         :class="toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
         class="fixed top-20 right-5 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between min-w-[300px]">
      <span>{{ toast.message }}</span>
      <button @click="dismissToast" class="ml-4 text-xl font-semibold">&times;</button>
    </div>

    <!-- 등록 폼 -->
    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 제목 -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
            축제 제목 <span class="text-red-500">*</span>
          </label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            maxlength="200"
            placeholder="축제 제목을 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.title }"
          />
          <div v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</div>
        </div>

        <!-- 내용 -->
        <div>
          <AdminTextEditor
            v-model="formData.content"
            label="축제 내용"
            :required="true"
            :rows="12"
            :max-length="5000"
            :show-preview="true"
            placeholder="축제에 대한 상세한 내용을 입력하세요. 띄어쓰기, 개행, 이모티콘 등이 그대로 보존됩니다."
            help-text="입력한 내용은 사용자에게 그대로 표시됩니다. 개행과 띄어쓰기가 보존됩니다."
            :has-error="!!errors.content"
            :error-message="errors.content"
          />
        </div>

        <!-- 작성자명 -->
        <div>
          <label for="writer_name" class="block text-sm font-medium text-gray-700 mb-2">
            작성자명
          </label>
          <input
            id="writer_name"
            v-model="formData.writer_name"
            type="text"
            maxlength="100"
            placeholder="작성자명을 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <!-- 원본 URL -->
        <div>
          <label for="source_url" class="block text-sm font-medium text-gray-700 mb-2">
            원본 URL
          </label>
          <input
            id="source_url"
            v-model="formData.source_url"
            type="url"
            placeholder="https://example.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.source_url }"
          />
          <div v-if="errors.source_url" class="mt-1 text-sm text-red-600">{{ errors.source_url }}</div>
        </div>

        <!-- 노출 여부 -->
        <div>
          <label class="flex items-center">
            <input
              v-model="formData.is_exposed"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">즉시 노출</span>
          </label>
          <p class="mt-1 text-xs text-gray-500">
            체크하면 등록 즉시 사용자에게 노출됩니다. 체크하지 않으면 관리자가 별도로 노출 설정을 해야 합니다.
          </p>
        </div>

        <!-- 관리자 메모 -->
        <div>
          <label for="admin_memo" class="block text-sm font-medium text-gray-700 mb-2">
            관리자 메모
          </label>
          <textarea
            id="admin_memo"
            v-model="formData.admin_memo"
            rows="3"
            maxlength="500"
            placeholder="관리자용 메모를 입력하세요 (선택사항)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-y"
          />
        </div>

        <!-- 버튼 영역 -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="goBack"
            class="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            취소
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? '등록 중...' : '축제 등록' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { Festival } from '~/server/types/entities';

definePageMeta({
  layout: 'admin',
  middleware: ['auth-admin']
});

// 폼 데이터
const formData = reactive({
  title: '',
  content: '',
  writer_name: '',
  source_url: '',
  is_exposed: false,
  admin_memo: ''
});

// 상태 관리
const isSubmitting = ref(false);
const errors = ref<Record<string, string>>({});
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);

// 유효성 검사
function validateForm(): boolean {
  errors.value = {};

  if (!formData.title.trim()) {
    errors.value.title = '축제 제목은 필수입니다.';
  }

  if (!formData.content.trim()) {
    errors.value.content = '축제 내용은 필수입니다.';
  }

  if (formData.source_url && !isValidUrl(formData.source_url)) {
    errors.value.source_url = '올바른 URL 형식이 아닙니다.';
  }

  return Object.keys(errors.value).length === 0;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// 폼 제출
async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  toast.value = null;

  try {
    const response = await $fetch('/api/admin/festivals/create', {
      method: 'POST',
      body: {
        title: formData.title.trim(),
        content: formData.content.trim(),
        writer_name: formData.writer_name.trim() || null,
        source_url: formData.source_url.trim() || null,
        is_exposed: formData.is_exposed,
        admin_memo: formData.admin_memo.trim() || null
      }
    });

    // @ts-ignore
    if (response.success) {
      toast.value = { message: '축제가 성공적으로 등록되었습니다.', type: 'success' };

      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        goBack();
      }, 2000);
    } else {
      // @ts-ignore
      toast.value = { message: response.message || '등록에 실패했습니다.', type: 'error' };
    }
  } catch (error: any) {
    console.error('축제 등록 오류:', error);
    toast.value = {
      message: error.data?.statusMessage || error.data?.message || '등록 중 오류가 발생했습니다.',
      type: 'error'
    };
  } finally {
    isSubmitting.value = false;
  }
}

function goBack() {
  if (import.meta.client) {
    window.location.href = '/admin/content/festivals';
  }
}

function dismissToast() {
  toast.value = null;
}
</script>

<style scoped>
/* 추가 스타일이 필요한 경우 여기에 작성 */
</style>

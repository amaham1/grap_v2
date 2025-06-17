<template>
  <div class="text-editor-container">
    <div class="mb-2 flex justify-between items-center">
      <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
      <div class="text-xs text-gray-500">
        {{ currentLength }}/{{ maxLength }} 글자
      </div>
    </div>
    
    <!-- 텍스트 에디터 영역 -->
    <div class="relative">
      <textarea
        :id="inputId"
        ref="textareaRef"
        v-model="internalValue"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :rows="rows"
        :disabled="disabled"
        :required="required"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-y"
        :class="{
          'bg-gray-50 cursor-not-allowed': disabled,
          'border-red-300 focus:ring-red-500 focus:border-red-500': hasError
        }"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <!-- 에러 메시지 -->
      <div v-if="hasError && errorMessage" class="mt-1 text-sm text-red-600">
        {{ errorMessage }}
      </div>
      
      <!-- 도움말 텍스트 -->
      <div v-if="helpText" class="mt-1 text-sm text-gray-500">
        {{ helpText }}
      </div>
    </div>
    
    <!-- 미리보기 영역 (선택사항) -->
    <div v-if="showPreview && internalValue" class="mt-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">미리보기:</h4>
      <div 
        class="p-3 bg-gray-50 border border-gray-200 rounded-md whitespace-pre-wrap text-sm"
        v-html="formattedPreview"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  showPreview?: boolean;
  helpText?: string;
  errorMessage?: string;
  hasError?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'input', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '내용을 입력하세요...',
  rows: 8,
  maxLength: 5000,
  disabled: false,
  required: false,
  showPreview: false,
  hasError: false
});

const emit = defineEmits<Emits>();

const textareaRef = ref<HTMLTextAreaElement>();
const internalValue = ref(props.modelValue);
const inputId = `text-editor-${Math.random().toString(36).substr(2, 9)}`;

// 현재 글자 수 계산
const currentLength = computed(() => {
  return internalValue.value.length;
});

// 미리보기용 포맷팅 (개행을 <br>로 변환, HTML 이스케이프)
const formattedPreview = computed(() => {
  if (!internalValue.value) return '';
  
  // HTML 특수문자 이스케이프
  const escaped = internalValue.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // 개행을 <br>로 변환
  return escaped.replace(/\n/g, '<br>');
});

// 부모 컴포넌트의 modelValue 변경 감지
watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue;
  }
});

// 내부 값 변경 시 부모에게 전달
watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue);
});

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  internalValue.value = target.value;
  emit('input', target.value);
}

function handleBlur(event: FocusEvent) {
  emit('blur', event);
}

function handleFocus(event: FocusEvent) {
  emit('focus', event);
}

// 외부에서 포커스 설정할 수 있도록 expose
function focus() {
  nextTick(() => {
    textareaRef.value?.focus();
  });
}

defineExpose({
  focus
});
</script>

<style scoped>
.text-editor-container {
  @apply w-full;
}

/* 텍스트 영역 스타일 커스터마이징 */
textarea {
  font-family: inherit;
  line-height: 1.5;
}

/* 스크롤바 스타일 (웹킷 기반 브라우저) */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

<template>
  <div class="fixed bottom-6 right-6 z-40">
    <button
      @click="handleGetLocation"
      :disabled="isGettingLocation"
      class="w-14 h-14 bg-white hover:bg-gray-50 disabled:bg-gray-200 text-black border border-gray-300 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      :title="isGettingLocation ? '위치 확인 중...' : '현재 위치'"
    >
      <!-- 로딩 상태 -->
      <div v-if="isGettingLocation" class="animate-spin">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      
      <!-- 일반 상태 - GPS 위치 아이콘 -->
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    </button>
    
    <!-- 위치 정보 성공 피드백 -->
    <div 
      v-if="showSuccessFeedback" 
      class="absolute bottom-16 right-0 bg-green-500 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg animate-fade-in-out"
    >
      위치 확인 완료!
    </div>
    
    <!-- 위치 정보 실패 피드백 -->
    <div 
      v-if="showErrorFeedback" 
      class="absolute bottom-16 right-0 bg-red-500 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg animate-fade-in-out"
    >
      위치 확인 실패
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isGettingLocation: boolean;
}

interface Emits {
  (e: 'getCurrentLocation'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 피드백 상태
const showSuccessFeedback = ref(false);
const showErrorFeedback = ref(false);

// 이전 위치 확인 상태 추적
const wasGettingLocation = ref(false);

// 위치 확인 상태 변화 감지
watch(() => props.isGettingLocation, (newValue, oldValue) => {
  if (oldValue && !newValue) {
    // 위치 확인이 완료됨
    if (wasGettingLocation.value) {
      showSuccessFeedback.value = true;
      setTimeout(() => {
        showSuccessFeedback.value = false;
      }, 2000);
    }
  }
  wasGettingLocation.value = newValue;
});

const handleGetLocation = () => {
  emit('getCurrentLocation');
};
</script>

<style scoped>
@keyframes fade-in-out {
  0% { opacity: 0; transform: translateY(10px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}

.animate-fade-in-out {
  animation: fade-in-out 2s ease-in-out;
}
</style>

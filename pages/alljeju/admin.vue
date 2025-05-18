<template>
  <div class="admin-page">
    <h1>관리자 페이지</h1>
    <p>환영합니다, 관리자님!</p>
    <p>이곳에서 다양한 관리 작업을 수행할 수 있습니다.</p>
    
    <button @click="logout" :disabled="isLoggingOut">
      {{ isLoggingOut ? '로그아웃 중...' : '로그아웃' }}
    </button>
    <p v-if="logoutError" class="error-message">{{ logoutError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggingOut = ref(false);
const logoutError = ref<string | null>(null);

// 페이지 접근 시 인증 및 권한 확인 (미들웨어에서 처리하지만, 추가 방어 로직으로도 사용 가능)
// definePageMeta({
//   middleware: 'auth'
// });

const logout = async () => {
  isLoggingOut.value = true;
  logoutError.value = null;
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    });
    // 로그아웃 성공 시 쿠키가 삭제되므로, 다음 네비게이션에서 미들웨어가 로그인 페이지로 리디렉션할 것입니다.
    // 명시적으로 로그인 페이지로 보내고 싶다면 아래와 같이 사용
    await router.push('/alljeju/login');
  } catch (error: any) {
    console.error('로그아웃 실패:', error);
    logoutError.value = error.data?.message || '로그아웃 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<style scoped>
.admin-page {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.admin-page h1 {
  color: #333;
  margin-bottom: 1rem;
}

.admin-page p {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-top: 1rem;
}
</style>

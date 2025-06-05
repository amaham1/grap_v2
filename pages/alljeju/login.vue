<template>
  <div>
    <h1>로그인</h1>
    <form @submit.prevent="login">
      <div>
        <label for="username">사용자 이메일:</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div>
        <label for="password">비밀번호:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">로그인</button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref(''); // 사용자 입력값 (이메일)
const password = ref('');
const error = ref<string | null>(null); // 에러 메시지 상태
const router = useRouter();

const login = async () => {
  error.value = null; // 이전 에러 메시지 초기화
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: username.value, // API 요청 시에는 'email' 키로 전송
        password: password.value,
      },
    });

    // API 응답에서 success 플래그와 메시지를 확인 (login.post.ts 참조)
    if (response && response.success) {
      // HttpOnly 쿠키는 서버에서 자동으로 설정됨.
      // 브라우저가 쿠키를 확실히 설정하고 다음 요청에 포함하도록 전체 페이지 이동을 사용합니다.
      window.location.href = '/alljeju/admin';
    } else {
      // API 호출은 성공했으나 로그인 자체는 실패한 경우 (e.g., 자격 증명 불일치)
      error.value = response.message || '이메일 또는 비밀번호가 올바르지 않습니다.';
      console.error('로그인 실패 (API 응답):', response.message);
    }
  } catch (e: any) {
    // 네트워크 오류 또는 API에서 throw한 HTTP 에러 (e.g., 401, 403, 500 등)
    console.error('로그인 API 호출 중 오류 발생:', e);
    if (e.data && e.data.message) {
      error.value = e.data.message; // API가 반환한 에러 메시지 사용
    } else {
      error.value = '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  }
};
</script>

<style scoped>
form div {
  margin-bottom: 1rem;
}
label {
  display: block; /* 레이블을 블록 요소로 만들어 줄바꿈 및 정렬 용이 */
  margin-bottom: 0.25rem;
}
input {
  width: 100%; /* 입력 필드가 컨테이너 너비에 맞게 확장되도록 함 */
  padding: 0.5rem;
  box-sizing: border-box; /* 패딩과 테두리가 너비 계산에 포함되도록 함 */
}
button {
  padding: 0.5rem 1rem;
  cursor: pointer;
  margin-top: 0.5rem; /* 버튼 위에 약간의 여백 추가 */
}
.error-message { /* 에러 메시지 스타일 */
  color: red;
  margin-top: 1rem;
}
</style>
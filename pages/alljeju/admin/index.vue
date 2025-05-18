<template>
  <div>
    <h1>관리자 페이지</h1>
    <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
    <button @click="logout">로그아웃</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: 'auth'
});

const router = useRouter()

const logout = () => {
  // 실제 애플리케이션에서는 저장된 인증 정보를 삭제하는 로직을 추가합니다.
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  console.log('로그아웃, 쿠키 삭제됨');
  router.push('/alljeju/login'); // 경로 수정됨
}
</script>

<style scoped>
button {
  margin-top: 1rem;
}
</style> 
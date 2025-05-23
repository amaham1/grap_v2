<template>
  <div>
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// 다크 모드 설정을 위한 HTML 클래스 추가
if (process.client) {
  // 로컬 스토리지에서 다크 모드 설정 가져오기
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    document.documentElement.classList.add('dark');
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // 시스템 설정이 다크 모드인 경우
    document.documentElement.classList.add('dark');
  }
}
</script>

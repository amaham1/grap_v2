export default defineNuxtRouteMiddleware(async (to, from) => {
  // Nuxt 3에서는 useNuxtApp()을 통해 composables에 접근합니다.
  const { $auth } = useNuxtApp(); // $auth는 예시이며, 실제 사용하는 인증 플러그인/모듈에 따라 달라집니다.

  // 실제 인증 로직 예시 (여기서는 NuxtAuth.js 또는 유사한 라이브러리를 사용한다고 가정)
  // const session = await $auth.getSession(); // 실제 세션 가져오는 로직

  // 임시 인증 로직: 여기서는 단순화를 위해 항상 'admin'이라고 가정하거나,
  // 간단한 쿠키 값 등을 확인할 수 있습니다.
  // 실제 프로덕션 환경에서는 강력한 인증 메커니즘을 사용해야 합니다.
  const isAuthenticated = true; // 임시: 항상 인증된 것으로 간주
  const userRole = 'admin'; // 임시: 항상 'admin' 역할로 간주

  // console.log('Auth Admin Middleware: Checking access for', to.path);

  if (!isAuthenticated) {
    // console.log('User not authenticated, redirecting to login.');
    // 로그인 페이지로 리디렉션 (로그인 페이지 경로에 맞게 수정)
    // return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
    // 우선은 접근 불가 시 홈페이지로 리디렉션
    return navigateTo('/');
  }

  if (userRole !== 'admin') {
    // console.log('User is not admin, redirecting to home.');
    // 관리자가 아닌 경우 접근 거부 (예: 홈페이지로 리디렉션)
    return navigateTo('/');
  }

  // console.log('User is admin, access granted.');
  // 인증 및 권한 검사 통과
});

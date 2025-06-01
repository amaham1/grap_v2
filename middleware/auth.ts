import { defineNuxtRouteMiddleware, navigateTo, useRequestEvent, useState } from '#app';
import type { JwtPayload } from '~/server/utils/authVerify'; // JwtPayload 타입 임포트

export default defineNuxtRouteMiddleware(async (to, from) => {
  const userState = useState<JwtPayload | null>('user', () => null); // 초기값 명시적 설정

  // 서버 사이드에서 실행될 때
  if (process.server) {
    const event = useRequestEvent();
    // verifyAuthToken을 동적으로 임포트합니다.
    const { verifyAuthToken } = await import('~/server/utils/authVerify');
    const decodedUser = event ? await verifyAuthToken(event) : null;

    // verifyAuthToken 결과에 따라 userState.value를 미들웨어에서 직접 설정합니다.
    if (decodedUser) {
      userState.value = decodedUser;
    } else {
      userState.value = null;
    }

    if (decodedUser && decodedUser.role === 'admin') {
      // console.log(`[Middleware-SSR] Authenticated admin access allowed for path: ${to.path}`);
      if (to.path === '/alljeju/login') {
        return navigateTo('/alljeju/admin');
      }
      return; 
    } else if (decodedUser && decodedUser.role !== 'admin') {
      if (to.path.startsWith('/alljeju/admin')) {
        // console.log(`[Middleware-SSR] Non-admin user attempting to access admin path: ${to.path}. Redirecting to login.`);
        return navigateTo('/alljeju/login');
      }
    } else { // decodedUser가 null (인증되지 않음)
      if (to.path.startsWith('/alljeju/admin')) {
        // console.log(`[Middleware-SSR] Unauthenticated user attempting to access admin path: ${to.path}. Redirecting to login.`);
        return navigateTo('/alljeju/login');
      }
    }
    return;

  } else if (process.client) {
    // 클라이언트 사이드: useState에서 사용자 정보를 가져옵니다.
    const user = userState.value;

    if (user && user.role === 'admin') {
      // console.log(`[Middleware-CSR] Authenticated admin access allowed for path: ${to.path}`);
      if (to.path === '/alljeju/login') {
        return navigateTo('/alljeju/admin');
      }
      return; 
    } else if (user && user.role !== 'admin') {
      if (to.path.startsWith('/alljeju/admin')) {
        // console.log(`[Middleware-CSR] Non-admin user attempting to access admin path: ${to.path}. Redirecting to login.`);
        return navigateTo('/alljeju/login'); 
      }
    } else { // user가 null (인증되지 않음)
      if (to.path.startsWith('/alljeju/admin')) {
        console.log(`[Middleware-CSR] Not authenticated (user state is null), redirecting to /alljeju/login for path: ${to.path}`);
        return navigateTo('/alljeju/login');
      }
    }
    // console.log(`[Middleware-CSR] Client-side check for path: ${to.path}, User role: ${user?.role || 'guest'}`);
  }
  console.log(`[Middleware] Allowing access to ${to.path} from ${from.path} (default/fallthrough)`);
});
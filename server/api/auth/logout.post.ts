import { defineEventHandler, deleteCookie } from 'h3';

export default defineEventHandler(async (event) => {
  // 'authToken' 쿠키 삭제
  deleteCookie(event, 'authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });

  console.log('User logged out successfully.');
  return {
    success: true,
    message: '로그아웃 되었습니다.',
  };
});

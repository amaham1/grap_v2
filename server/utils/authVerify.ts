// server/utils/authVerify.ts
import { jwtVerify } from 'jose';
import type { H3Event } from 'h3';
// getCookie를 h3에서 직접 가져오도록 명시합니다.
import { getCookie } from 'h3';

// JwtPayload 인터페이스를 export하여 다른 곳에서도 타입을 사용할 수 있게 합니다.
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number; // JWT 표준 클레임 (선택적)
  exp?: number; // JWT 표준 클레임 (선택적)
  // 다른 필요한 사용자 정보가 있다면 여기에 추가
}

export async function verifyAuthToken(event: H3Event): Promise<JwtPayload | null> {
  const tokenCookie = getCookie(event, 'authToken');
  const config = useRuntimeConfig();
  const jwtSecret = config.jwtSecretKey;

  if (!tokenCookie || !jwtSecret) {
    // console.log('[authVerify] Token or JWT_SECRET_KEY is missing.');
    return null;
  }

  try {
    // JWT 시크릿을 TextEncoder로 인코딩
    const secret = new TextEncoder().encode(jwtSecret);

    const { payload } = await jwtVerify(tokenCookie, secret);
    // console.log('[authVerify] Token verified successfully:', payload);
    return payload as JwtPayload;
  } catch (error) {
    // console.error('[authVerify] Invalid token error object:', error);
    // console.log('[AuthVerify] JWT verification failed, token might be invalid or expired.');
    // 프로덕션에서는 실제 오류 객체 대신 일반 메시지를 로깅하는 것이 좋을 수 있습니다.
    return null;
  }
}

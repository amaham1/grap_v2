import { defineEventHandler, readBody, createError, setCookie } from 'h3';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { executeSupabaseQuery } from '~/server/utils/supabase';

// User 인터페이스 정의
interface User {
  id: string;
  email: string;
  password?: string; // DB에서 password가 NULL일 수 있음을 반영
  role: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body; // 클라이언트에서 받은 비밀번호는 항상 문자열로 가정

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: '이메일과 비밀번호를 모두 입력해주세요.',
    });
  }

  const config = useRuntimeConfig();
  const jwtSecret = config.jwtSecretKey;
  const jwtExpiresIn = config.jwtExpiresIn || '7d';

  if (!jwtSecret) {
    console.error('JWT_SECRET_KEY is not defined in runtime config');
    throw createError({
      statusCode: 500,
      statusMessage: '서버 설정 오류입니다. 관리자에게 문의하세요.',
    });
  }

  try {
    const result = await executeSupabaseQuery<User>('users', 'select', {
      select: 'id, email, password, role',
      filters: { email }
    });

    const users = result.data || [];

    if (!users || users.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: '존재하지 않는 사용자입니다.',
      });
    }

    const userFromDb = users[0]; // 원본 DB 결과를 다른 변수에 저장

    // Buffer를 문자열로 변환 (id, email, role은 VARBINARY/BINARY 타입일 수 있고, password는 해시된 문자열이어야 함)
    const user: User = {
      id: userFromDb.id && Buffer.isBuffer(userFromDb.id) ? userFromDb.id.toString('utf-8') : String(userFromDb.id ?? ''),
      email: userFromDb.email && Buffer.isBuffer(userFromDb.email) ? userFromDb.email.toString('utf-8') : String(userFromDb.email ?? ''),
      // password는 undefined일 수 있으므로, Buffer일 때만 toString() 호출, 아니면 그대로 사용 (이미 문자열이거나 undefined)
      password: userFromDb.password && Buffer.isBuffer(userFromDb.password) ? userFromDb.password.toString('utf-8') : userFromDb.password,
      role: userFromDb.role && Buffer.isBuffer(userFromDb.role) ? userFromDb.role.toString('utf-8') : String(userFromDb.role ?? ''),
    };
    // 이제 user 객체의 필드들은 문자열 (또는 password의 경우 undefined) 입니다.

    // Debugging: Log the user object and password types
    console.log('User object after Buffer conversion:', JSON.stringify(user, null, 2)); // 변환 후 user 객체 로깅
    console.log('Type of input password:', typeof password, '- Value (first 5 chars):', password.substring(0,5)); // 사용자 입력값 (보안상 전체 출력 지양)
    console.log('Type of user.password from DB:', typeof user.password, '- Value (if string, first 5 chars):', typeof user.password === 'string' ? user.password.substring(0,5) : user.password); // DB에서 가져온 값

    // user.password가 존재하고 문자열인지 확인
    if (!user.password || typeof user.password !== 'string') {
        console.error('User password from DB is not a string or is missing. Actual value:', user.password);
        throw createError({
            statusCode: 401, // 인증 실패로 처리
            statusMessage: '계정 정보에 문제가 있어 로그인할 수 없습니다. 관리자에게 문의하세요.', // 좀 더 일반적인 메시지
        });
    }

    // 이제 user.password는 확실히 문자열이므로 bcrypt.compare를 안전하게 호출 가능
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: '비밀번호가 일치하지 않습니다.',
      });
    }

    if (user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '관리자 권한이 없는 사용자입니다.',
      });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // JWT 시크릿을 TextEncoder로 인코딩
    const secret = new TextEncoder().encode(jwtSecret);

    // 만료 시간 계산 (7d = 7일)
    const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7일

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(secret);

    setCookie(event, 'authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    console.log(`User ${user.email} logged in successfully.`);
    return {
      success: true,
      message: '로그인 성공!',
      user: { // 클라이언트에 반환되는 사용자 정보에는 비밀번호 제외
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    // createError로 발생시킨 에러는 그대로 다시 throw
    if (error.statusCode) {
      throw error;
    }
    // 그 외 예상치 못한 내부 서버 오류
    console.error('Login API unhandled error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '로그인 처리 중 예기치 않은 오류가 발생했습니다.',
    });
  }
});

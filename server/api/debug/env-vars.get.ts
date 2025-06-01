import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const envVars = {
      // Supabase 환경 변수 확인
      SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'not configured',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'configured' : 'not configured',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured',
      
      // 기타 환경 변수 확인
      JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? 'configured' : 'not configured',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || 'not configured',
      KAKAO_MAP_API_KEY: process.env.KAKAO_MAP_API_KEY ? 'configured' : 'not configured',
      NODE_ENV: process.env.NODE_ENV || 'not configured',
      
      // Runtime Config 확인
      runtimeConfig: {
        supabaseUrl: useRuntimeConfig().supabaseUrl ? 'configured' : 'not configured',
        supabaseServiceKey: useRuntimeConfig().supabaseServiceKey ? 'configured' : 'not configured',
        publicSupabaseUrl: useRuntimeConfig().public?.supabaseUrl ? 'configured' : 'not configured',
        publicSupabaseAnonKey: useRuntimeConfig().public?.supabaseAnonKey ? 'configured' : 'not configured'
      }
    };

    console.log('[환경 변수 확인]', envVars);

    return {
      timestamp: new Date().toISOString(),
      success: true,
      message: '환경 변수 확인 완료',
      envVars
    };
  } catch (error) {
    console.error('[환경 변수 확인 오류]', error);

    return {
      timestamp: new Date().toISOString(),
      success: false,
      message: '환경 변수 확인 중 오류 발생',
      details: error.message
    };
  }
});

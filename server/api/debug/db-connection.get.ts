import { defineEventHandler } from 'h3';
import { supabase } from '~/server/utils/supabase';


export default defineEventHandler(async (event) => {
  try {
    // Supabase 연결 테스트
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    const connectionTest = {
      success: !error,
      message: error ? 'Supabase connection failed' : 'Supabase connection successful',
      details: error ? error.message : 'Connected to Supabase successfully',
      config: {
        connectionType: 'Supabase',
        url: process.env.SUPABASE_URL ? 'configured' : 'not configured',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured',
        anonKey: process.env.SUPABASE_ANON_KEY ? 'configured' : 'not configured'
      }
    };

    // 콘솔에도 로그 출력
    console.log('[DB 연결 테스트]', connectionTest);

    return {
      timestamp: new Date().toISOString(),
      ...connectionTest
    };
  } catch (error) {
    console.error('[DB 연결 테스트 오류]', error);

    return {
      timestamp: new Date().toISOString(),
      success: false,
      message: 'DB 연결 테스트 중 오류 발생',
      details: error.message,
      config: {
        connectionType: 'Supabase',
        url: process.env.SUPABASE_URL ? 'configured' : 'not configured',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured',
        anonKey: process.env.SUPABASE_ANON_KEY ? 'configured' : 'not configured'
      }
    };
  }
});

import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0
    }
  };

  // Supabase 연결 테스트
  const supabaseTest = {
    name: 'Supabase Connection Test',
    status: 'unknown',
    details: {} as any
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      supabaseTest.status = 'failed';
      supabaseTest.details = {
        error: error.message,
        code: error.code
      };
    } else {
      supabaseTest.status = 'passed';
      supabaseTest.details = {
        message: 'Supabase connection successful',
        url: process.env.SUPABASE_URL ? 'configured' : 'not configured',
        key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'not configured'
      };
    }
  } catch (error) {
    supabaseTest.status = 'failed';
    supabaseTest.details = {
      error: error.message
    };
  }

  results.tests.push(supabaseTest);

  // 요약 계산
  results.summary.totalTests = results.tests.length;
  results.summary.passed = results.tests.filter(test => test.status === 'passed').length;
  results.summary.failed = results.tests.filter(test => test.status === 'failed').length;

  return results;
});

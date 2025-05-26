import { checkEnvironmentVariables, checkRuntimeConfig } from '~/server/utils/env-check';


export default defineEventHandler(async (event) => {
  try {
    // 환경 변수 체크
    const envCheck = checkEnvironmentVariables();
    
    // Runtime Config 체크
    const runtimeCheck = checkRuntimeConfig();
    
    // 데이터베이스 연결 테스트
    const dbCheck = await testDatabaseConnection();
    
    return {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NITRO_PRESET: process.env.NITRO_PRESET,
      },
      environmentVariables: envCheck,
      runtimeConfig: runtimeCheck,
      databaseConnection: dbCheck,
      recommendations: generateRecommendations(envCheck, runtimeCheck, dbCheck)
    };
  } catch (error) {
    return {
      error: true,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }
});

function generateRecommendations(envCheck: any, runtimeCheck: any, dbCheck: any) {
  const recommendations = [];
  
  if (!envCheck.success) {
    recommendations.push({
      type: 'error',
      message: '환경 변수가 누락되었습니다.',
      action: '클라우드플레어 Pages 설정에서 환경 변수를 확인하세요.',
      missingVars: envCheck.missingVars
    });
  }
  
  if (!runtimeCheck.success) {
    recommendations.push({
      type: 'error',
      message: 'Runtime Config 로드에 실패했습니다.',
      action: 'nuxt.config.ts의 runtimeConfig 설정을 확인하세요.'
    });
  }
  
  if (!dbCheck.success) {
    if (dbCheck.config?.host === 'localhost') {
      recommendations.push({
        type: 'error',
        message: '데이터베이스 설정이 기본값(localhost)을 사용하고 있습니다.',
        action: '환경 변수가 제대로 로드되지 않았습니다. 클라우드플레어 환경 변수 설정을 확인하세요.'
      });
    } else {
      recommendations.push({
        type: 'warning',
        message: '데이터베이스 연결에 실패했습니다.',
        action: '네트워크 연결, 방화벽 설정, 데이터베이스 서버 상태를 확인하세요.'
      });
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: '모든 설정이 정상적으로 구성되었습니다.'
    });
  }
  
  return recommendations;
}

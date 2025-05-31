// functions/_middleware.ts
// 클라우드플레어 Pages Functions 미들웨어

export async function onRequest(context: any) {
  // 환경 변수 설정
  if (!context.env.NODE_ENV) {
    context.env.NODE_ENV = 'production';
  }

  // CORS 헤더 설정
  const response = await context.next();
  
  // API 요청에 대한 CORS 헤더 추가
  if (context.request.url.includes('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

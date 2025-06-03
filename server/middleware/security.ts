// server/middleware/security.ts
// 보안 헤더 설정 미들웨어

export default defineEventHandler(async (event) => {
  // API 요청에만 적용
  if (event.node.req.url?.startsWith('/api/')) {
    // Mixed Content 방지를 위한 보안 헤더 설정
    setHeader(event, 'Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
      "style-src 'self' 'unsafe-inline' https:; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss:; " +
      "font-src 'self' https:; " +
      "object-src 'none'; " +
      "media-src 'self' https:; " +
      "frame-src 'self' https:; " +
      "upgrade-insecure-requests"
    );

    // HTTPS 강제 (Cloudflare에서 자동 처리되지만 추가 보안)
    setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Mixed Content 차단
    setHeader(event, 'X-Content-Type-Options', 'nosniff');
    setHeader(event, 'X-Frame-Options', 'DENY');
    setHeader(event, 'X-XSS-Protection', '1; mode=block');
    
    // 서버 정보 숨기기
    setHeader(event, 'X-Powered-By', 'Cloudflare Workers');
    
    // CORS 설정 (필요한 경우)
    if (event.node.req.method === 'OPTIONS') {
      setHeader(event, 'Access-Control-Allow-Origin', 'https://grap.co.kr');
      setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      setHeader(event, 'Access-Control-Max-Age', '86400');
      
      // OPTIONS 요청에 대한 응답
      event.node.res.statusCode = 204;
      return '';
    }
  }
});

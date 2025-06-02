// server/api/debug/environment.get.ts
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    
    // 환경 변수 상태 확인 (보안상 실제 값은 마스킹)
    const environmentInfo = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      nitroPreset: process.env.NITRO_PRESET,
      
      // 공개 환경 변수들
      public: {
        kakaoMapApiKey: config.public?.kakaoMapApiKey ? 
          `${config.public.kakaoMapApiKey.substring(0, 8)}...` : 'NOT_SET',
        supabaseUrl: config.public?.supabaseUrl ? 
          `${config.public.supabaseUrl.substring(0, 20)}...` : 'NOT_SET',
        supabaseAnonKey: config.public?.supabaseAnonKey ? 
          `${config.public.supabaseAnonKey.substring(0, 8)}...` : 'NOT_SET',
      },
      
      // 서버 환경 변수들 (마스킹)
      server: {
        dbHost: config.dbHost ? '***' : 'NOT_SET',
        dbUser: config.dbUser ? '***' : 'NOT_SET',
        dbPassword: config.dbPassword ? '***' : 'NOT_SET',
        dbDatabase: config.dbDatabase ? '***' : 'NOT_SET',
        dbPort: config.dbPort ? '***' : 'NOT_SET',
        hyperdriveUrl: config.hyperdriveUrl ? '***' : 'NOT_SET',
        supabaseUrl: config.supabaseUrl ? '***' : 'NOT_SET',
        supabaseServiceKey: config.supabaseServiceKey ? '***' : 'NOT_SET',
        jwtSecretKey: config.jwtSecretKey ? '***' : 'NOT_SET',
        jwtExpiresIn: config.jwtExpiresIn || 'NOT_SET',
      },
      
      // 런타임 정보
      runtime: {
        platform: typeof process !== 'undefined' ? process.platform : 'unknown',
        version: typeof process !== 'undefined' ? process.version : 'unknown',
        arch: typeof process !== 'undefined' ? process.arch : 'unknown',
        isCloudflareWorkers: typeof globalThis.caches !== 'undefined',
        hasWindow: typeof window !== 'undefined',
        hasDocument: typeof document !== 'undefined',
      },
      
      // 요청 정보
      request: {
        url: getRequestURL(event).toString(),
        method: getMethod(event),
        headers: {
          userAgent: getHeader(event, 'user-agent') || 'unknown',
          host: getHeader(event, 'host') || 'unknown',
          cfRay: getHeader(event, 'cf-ray') || 'not-cloudflare',
          cfCountry: getHeader(event, 'cf-ipcountry') || 'unknown',
        }
      }
    };

    return {
      success: true,
      data: environmentInfo,
      message: 'Environment information retrieved successfully'
    };
    
  } catch (error) {
    console.error('Environment debug error:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve environment information'
    };
  }
});

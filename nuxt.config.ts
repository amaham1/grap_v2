// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: '/'
  },
  css: ['~/assets/css/tailwind.css'],
  alias: {
    '#mysql': '~/server/utils/mysql',
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    // 서버 사이드에서만 사용되는 환경 변수들
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbDatabase: process.env.DB_DATABASE,
    dbPort: process.env.DB_PORT,

    // Hyperdrive 설정
    hyperdriveUrl: process.env.HYPERDRIVE_URL,

    // Supabase 설정 (서버 사이드)
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // JWT 설정
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,

    public: {
      // 클라이언트에서도 접근 가능한 환경 변수들
      kakaoMapApiKey: process.env.KAKAO_MAP_API_KEY || 'f7c0b5b7e8a4c5d6e7f8a9b0c1d2e3f4',

      // Supabase 설정 (클라이언트 사이드)
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  }
})
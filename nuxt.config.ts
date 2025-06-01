// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR 모드로 변경 (Workers 지원)
  ssr: true,

  app: {
    baseURL: '/',
    head: {
      script: [
        {
          async: true,
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6491895061878011',
          crossorigin: 'anonymous'
        }
      ]
    }
  },
  css: ['~/assets/css/tailwind.css'],
  alias: {
    '#mysql': '~/server/utils/mysql',
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxtjs/tailwindcss'],
  nitro: {
    preset: 'cloudflare_module',
    compatibilityDate: '2024-09-19',
    experimental: {
      wasm: true
    },
    rollupConfig: {
      external: ['mysql2']
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },
    // Cloudflare Workers scheduled handler 설정
    handlers: [
      {
        route: '/__scheduled',
        handler: '~/server/api/scheduled-handler.ts',
        method: 'post'
      }
    ]
  },
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
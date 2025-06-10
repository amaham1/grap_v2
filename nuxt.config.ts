// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR 모드로 변경 (Workers 지원)
  ssr: true,

  app: {
    baseURL: '/',
    head: {
      htmlAttrs: {
        lang: 'ko'
      },
      title: 'Grap - 제주도 생활정보 플랫폼',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '제주도 주유소 최저가 정보, 축제, 전시회, 복지서비스 정보를 한곳에서 확인하세요. 실시간 유가 비교와 카카오맵 연동으로 편리한 제주도 생활정보를 제공합니다.' },
        { name: 'keywords', content: '제주도, 제주 주유소, 제주도 축제, 제주도 전시회, 제주도 복지서비스, 제주 유가, 제주도 생활정보' },
        { name: 'author', content: 'Grap' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:site_name', content: 'Grap - 제주도 생활정보' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'ko_KR' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://grap.co.kr' }
      ],
      script: [
        {
          async: true,
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6491895061878011',
          crossorigin: 'anonymous'
        },
        // Google Analytics (GA4) - 실제 사용 시 측정 ID를 설정하세요
        // {
        //   async: true,
        //   src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'
        // },
        // {
        //   innerHTML: `
        //     window.dataLayer = window.dataLayer || [];
        //     function gtag(){dataLayer.push(arguments);}
        //     gtag('js', new Date());
        //     gtag('config', 'G-XXXXXXXXXX');
        //   `
        // }
      ]
    }
  },
  css: ['~/assets/css/tailwind.css'],
  alias: {
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxtjs/tailwindcss', '@pinia/nuxt'],
  nitro: {
    preset: 'cloudflare_module',
    compatibilityDate: '2024-09-19',
    experimental: {
      wasm: true
    },
    rollupConfig: {
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
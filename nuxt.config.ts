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
    public: {
      kakaoMapApiKey: process.env.KAKAO_MAP_API_KEY || 'f7c0b5b7e8a4c5d6e7f8a9b0c1d2e3f4'
    }
  }
})
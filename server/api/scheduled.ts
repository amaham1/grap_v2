// server/api/scheduled.ts - Cloudflare Cron Triggers 핸들러
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  // 이 파일은 Cloudflare Workers의 scheduled handler를 위한 참조용입니다.
  // 실제 scheduled 이벤트는 Nuxt.js에서 직접 처리되지 않고,
  // Cloudflare Workers 런타임에서 처리됩니다.
  
  return {
    message: 'This endpoint is for reference only. Scheduled events are handled by Cloudflare Workers runtime.',
    cronTriggers: [
      {
        schedule: '0 17 * * *',
        description: '매일 새벽 2시 KST (17시 UTC 전날) - 주유소 API',
        endpoint: '/api/cron/gas-stations'
      },
      {
        schedule: '0 0 * * *', 
        description: '매일 오전 9시 KST (0시 UTC) - 축제, 전시회, 복지서비스 API',
        endpoints: [
          '/api/cron/festivals',
          '/api/cron/exhibitions', 
          '/api/cron/welfare-services'
        ]
      }
    ]
  };
});

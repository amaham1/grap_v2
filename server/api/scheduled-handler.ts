// server/api/scheduled-handler.ts - Cloudflare Workers Scheduled Handler
import { defineEventHandler, getHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // Cloudflare Workers scheduled event에서만 접근 가능하도록 제한
  const userAgent = getHeader(event, 'user-agent') || '';
  const cfScheduled = getHeader(event, 'cf-scheduled') || '';
  
  // Cloudflare Workers scheduled event 검증
  if (!cfScheduled && !userAgent.includes('Cloudflare-Workers')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'This endpoint is only accessible via Cloudflare Workers scheduled events.'
    });
  }

  const currentTime = new Date();
  const currentHour = currentTime.getUTCHours();
  
  console.log(`[SCHEDULED] Cron job triggered at ${currentTime.toISOString()}, UTC Hour: ${currentHour}`);

  try {
    // UTC 17시 (KST 새벽 2시) - 주유소 API 실행
    if (currentHour === 17) {
      console.log('[SCHEDULED] Triggering gas stations data fetch...');
      
      const gasStationResponse = await $fetch('/api/cron/gas-stations', {
        method: 'GET',
        headers: {
          'x-cron-source': 'cloudflare-scheduled',
          'user-agent': 'Cloudflare-Workers-Scheduled'
        }
      });
      
      console.log('[SCHEDULED] Gas stations fetch completed:', gasStationResponse);
    }
    
    // UTC 0시 (KST 오전 9시) - 축제, 전시회, 복지서비스 API 실행
    else if (currentHour === 0) {
      console.log('[SCHEDULED] Triggering content APIs fetch...');
      
      const contentApis = [
        { name: 'festivals', endpoint: '/api/cron/festivals' },
        { name: 'exhibitions', endpoint: '/api/cron/exhibitions' },
        { name: 'welfare-services', endpoint: '/api/cron/welfare-services' }
      ];
      
      const results = await Promise.allSettled(
        contentApis.map(async (api) => {
          console.log(`[SCHEDULED] Fetching ${api.name}...`);
          const response = await $fetch(api.endpoint, {
            method: 'GET',
            headers: {
              'x-cron-source': 'cloudflare-scheduled',
              'user-agent': 'Cloudflare-Workers-Scheduled'
            }
          });
          return { api: api.name, response };
        })
      );
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`[SCHEDULED] ${contentApis[index].name} fetch completed:`, result.value);
        } else {
          console.error(`[SCHEDULED] ${contentApis[index].name} fetch failed:`, result.reason);
        }
      });
    }
    
    return {
      success: true,
      message: `Scheduled job executed successfully at ${currentTime.toISOString()}`,
      utcHour: currentHour,
      executedApis: currentHour === 17 ? ['gas-stations'] : 
                   currentHour === 0 ? ['festivals', 'exhibitions', 'welfare-services'] : 
                   []
    };
    
  } catch (error) {
    console.error('[SCHEDULED] Error executing scheduled job:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `Scheduled job failed: ${error.message}`
    });
  }
});

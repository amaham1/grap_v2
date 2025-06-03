// worker-scheduled.js - Cloudflare Workers Scheduled Event Handler
// 이 파일은 Cloudflare Workers 런타임에서 scheduled 이벤트를 처리합니다.

export default {
  async scheduled(controller, env, ctx) {
    const scheduledTime = new Date(controller.scheduledTime);
    const currentHour = scheduledTime.getUTCHours();
    
    console.log(`[WORKER-SCHEDULED] Cron job triggered at ${scheduledTime.toISOString()}, UTC Hour: ${currentHour}`);

    // 현재 Worker의 URL을 가져옵니다 (환경 변수에서)
    const baseUrl = env.SITE_URL || 'https://grap.co.kr';
    
    try {
      // UTC 17시 (KST 새벽 2시) - 주유소 API 실행
      if (currentHour === 17) {
        console.log('[WORKER-SCHEDULED] Triggering gas stations data fetch...');
        
        const response = await fetch(`${baseUrl}/api/cron/gas-stations`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Cloudflare-Workers-Scheduled',
            'X-Cron-Source': 'cloudflare-scheduled',
            'CF-Scheduled': 'true'
          },
          // 3분 타임아웃 설정 (좌표 변환 시간 고려)
          signal: AbortSignal.timeout(180000)
        });
        
        if (!response.ok) {
          throw new Error(`Gas stations API failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('[WORKER-SCHEDULED] Gas stations fetch completed:', result);
      }
      
      // UTC 0시 (KST 오전 9시) - 축제, 전시회, 복지서비스 API 실행
      else if (currentHour === 0) {
        console.log('[WORKER-SCHEDULED] Triggering content APIs fetch...');
        
        const contentApis = [
          { name: 'festivals', endpoint: `${baseUrl}/api/cron/festivals` },
          { name: 'exhibitions', endpoint: `${baseUrl}/api/cron/exhibitions` },
          { name: 'welfare-services', endpoint: `${baseUrl}/api/cron/welfare-services` }
        ];
        
        const promises = contentApis.map(async (api) => {
          console.log(`[WORKER-SCHEDULED] Fetching ${api.name}...`);
          
          const response = await fetch(api.endpoint, {
            method: 'GET',
            headers: {
              'User-Agent': 'Cloudflare-Workers-Scheduled',
              'X-Cron-Source': 'cloudflare-scheduled',
              'CF-Scheduled': 'true'
            }
          });
          
          if (!response.ok) {
            throw new Error(`${api.name} API failed: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          return { api: api.name, result };
        });
        
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`[WORKER-SCHEDULED] ${contentApis[index].name} fetch completed:`, result.value);
          } else {
            console.error(`[WORKER-SCHEDULED] ${contentApis[index].name} fetch failed:`, result.reason);
          }
        });
      }
      
      console.log(`[WORKER-SCHEDULED] Scheduled job completed successfully at ${scheduledTime.toISOString()}`);
      
    } catch (error) {
      console.error('[WORKER-SCHEDULED] Error executing scheduled job:', error);
      
      // 에러를 다시 던지지 않고 로그만 남깁니다.
      // Cloudflare Workers에서는 scheduled 이벤트에서 에러가 발생해도 재시도하지 않습니다.
    }
  }
};

export const useDbConnection = () => {
  const checkConnection = async () => {
    try {
      console.log('🔍 [DB 연결 확인] 시작...');
      
      const response = await $fetch('/api/debug/db-connection');
      
      return response;
    } catch (error: any) {
      console.error('🚨 [DB 연결 확인 오류]', {
        error: error?.message || error,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        message: 'DB 연결 확인 API 호출 실패',
        details: error?.message || error,
        timestamp: new Date().toISOString()
      };
    }
  };

  const checkConnectionOnMount = () => {
    onMounted(async () => {
      // 클라이언트에서만 실행하고, 개발 환경에서만 실행
      if (import.meta.client && import.meta.dev) {
        await checkConnection();
      }
    });
  };

  return {
    checkConnection,
    checkConnectionOnMount
  };
};

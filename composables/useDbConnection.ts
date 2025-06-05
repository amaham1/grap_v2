export const useDbConnection = () => {
  const checkConnection = async () => {
    try {
      console.log('🔍 [DB 연결 확인] 시작...');
      
      const response = await $fetch('/api/debug/db-connection');
      
      return response;
    } catch (error) {
      console.error('🚨 [DB 연결 확인 오류]', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        message: 'DB 연결 확인 API 호출 실패',
        details: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const checkConnectionOnMount = () => {
    onMounted(async () => {
      await checkConnection();
    });
  };

  return {
    checkConnection,
    checkConnectionOnMount
  };
};

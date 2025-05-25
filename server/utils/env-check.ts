// 환경 변수 확인 및 디버깅 유틸리티

export function checkEnvironmentVariables() {
  const envVars = {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD ? '***' : undefined, // 보안상 마스킹
    DB_DATABASE: process.env.DB_DATABASE,
    DB_PORT: process.env.DB_PORT,
    HYPERDRIVE_URL: process.env.HYPERDRIVE_URL ? '***' : undefined, // 보안상 마스킹
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? '***' : undefined,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    KAKAO_MAP_API_KEY: process.env.KAKAO_MAP_API_KEY ? '***' : undefined,
    NODE_ENV: process.env.NODE_ENV,
    NITRO_PRESET: process.env.NITRO_PRESET,
  };

  console.log('Environment Variables Check:', envVars);

  // 필수 환경 변수 체크
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return {
      success: false,
      missingVars,
      availableVars: envVars
    };
  }

  return {
    success: true,
    availableVars: envVars
  };
}

// Runtime Config 확인 함수
export function checkRuntimeConfig() {
  try {
    const config = useRuntimeConfig();

    const runtimeVars = {
      dbHost: config.dbHost,
      dbUser: config.dbUser,
      dbPassword: config.dbPassword ? '***' : undefined,
      dbDatabase: config.dbDatabase,
      dbPort: config.dbPort,
      hyperdriveUrl: config.hyperdriveUrl ? '***' : undefined,
      jwtSecretKey: config.jwtSecretKey ? '***' : undefined,
      jwtExpiresIn: config.jwtExpiresIn,
      kakaoMapApiKey: config.public?.kakaoMapApiKey ? '***' : undefined,
    };

    console.log('Runtime Config Check:', runtimeVars);

    return {
      success: true,
      runtimeVars
    };
  } catch (error) {
    console.error('Runtime Config Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

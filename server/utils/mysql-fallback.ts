import mysql from 'mysql2/promise';

// 더 강력한 연결 재시도 로직을 가진 MySQL 연결
let pool: mysql.Pool | undefined;

// 연결 재시도 함수
async function createPoolWithRetry(config: any, maxRetries = 3): Promise<mysql.Pool | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${maxRetries}`);
      
      const testPool = mysql.createPool(config);
      
      // 연결 테스트
      const connection = await testPool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log('Database connection successful');
      return testPool;
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All connection attempts failed');
        return null;
      }
      
      // 재시도 전 대기 (지수 백오프)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

// 풀 초기화 함수
async function initializePool() {
  if (pool) return pool;
  
  try {
    const config = useRuntimeConfig();
    
    // 클라우드플레어 환경에 최적화된 설정
    const dbConfig = {
      host: config.dbHost || process.env.DB_HOST || 'localhost',
      user: config.dbUser || process.env.DB_USER || 'root',
      password: config.dbPassword || process.env.DB_PASSWORD || '',
      database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
      port: parseInt(config.dbPort || process.env.DB_PORT || '3306'),
      
      // 연결 풀 설정
      waitForConnections: true,
      connectionLimit: 3, // 클라우드플레어에서는 적은 연결 수 사용
      queueLimit: 0,
      
      // 타임아웃 설정
      acquireTimeout: 30000, // 30초
      timeout: 30000, // 30초
      
      // 재연결 설정
      reconnect: true,
      
      // 문자셋 및 인코딩
      charset: 'utf8mb4',
      bigNumberStrings: true,
      supportBigNumbers: true,
      dateStrings: false,
      
      // SSL 설정 (필요시 조정)
      ssl: false,
      
      // 연결 유지 설정
      keepAliveInitialDelay: 0,
      enableKeepAlive: true,
      
      typeCast: function (field, next) {
        if (field.type === 'VAR_STRING' || field.type === 'VARCHAR' || field.type === 'STRING' ||
            field.type === 'TEXT' || field.type === 'MEDIUMTEXT' || field.type === 'LONGTEXT' ||
            field.type === 'BLOB' || field.type === 'MEDIUMBLOB' || field.type === 'LONGBLOB') {
          const fieldBuffer = field.buffer();
          if (fieldBuffer) {
            return fieldBuffer.toString('utf8');
          }
        }
        return next();
      }
    };

    console.log('Initializing database pool with enhanced config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
      connectionLimit: dbConfig.connectionLimit
    });

    pool = await createPoolWithRetry(dbConfig);
    return pool;
  } catch (error) {
    console.error('Failed to initialize database pool:', error);
    pool = undefined;
    return undefined;
  }
}

// 쿼리 실행 함수 (재시도 로직 포함)
export async function executeQuery<T>(sql: string, params?: any[], retries = 2): Promise<T> {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const currentPool = await initializePool();
      
      if (!currentPool) {
        throw new Error('Database pool is not available');
      }

      // boolean 값을 MySQL에서 사용할 수 있는 형태로 변환
      const processedParams = params?.map(param => {
        if (typeof param === 'boolean') {
          return param ? 1 : 0;
        }
        return param;
      });

      const [rows] = await currentPool.execute(sql, processedParams);
      return rows as T;
    } catch (error) {
      console.error(`Query attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries + 1) {
        throw error;
      }
      
      // 연결 오류시 풀 재설정
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        pool = undefined;
      }
      
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Query execution failed after all retries');
}

// DB 연결 테스트 함수
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
  config?: any;
}> {
  try {
    const currentPool = await initializePool();
    
    if (!currentPool) {
      const config = useRuntimeConfig();
      return {
        success: false,
        message: 'Database pool is not available',
        details: 'Pool creation failed during initialization',
        config: {
          host: config.dbHost || process.env.DB_HOST || 'localhost',
          user: config.dbUser || process.env.DB_USER || 'root',
          database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
          port: config.dbPort || process.env.DB_PORT || '3306',
        }
      };
    }

    // 간단한 쿼리로 연결 테스트
    const [rows] = await currentPool.execute('SELECT 1 as test, NOW() as current_time, VERSION() as mysql_version');
    const config = useRuntimeConfig();

    return {
      success: true,
      message: 'Database connection successful',
      details: rows,
      config: {
        host: config.dbHost || process.env.DB_HOST || 'localhost',
        user: config.dbUser || process.env.DB_USER || 'root',
        database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
        port: config.dbPort || process.env.DB_PORT || '3306',
      }
    };
  } catch (error) {
    const config = useRuntimeConfig();
    return {
      success: false,
      message: 'Database connection failed',
      details: error.message,
      config: {
        host: config.dbHost || process.env.DB_HOST || 'localhost',
        user: config.dbUser || process.env.DB_USER || 'root',
        database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
        port: config.dbPort || process.env.DB_PORT || '3306',
      }
    };
  }
}

export function getPool() {
  return initializePool();
}

import mysql from 'mysql2/promise';

// 데이터베이스 연결 풀 생성
let pool: mysql.Pool | undefined;

// Hyperdrive URL 파싱 함수
function parseHyperdriveUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1), // '/' 제거
    };
  } catch (error) {
    console.error('Failed to parse Hyperdrive URL:', error);
    return null;
  }
}

// 풀 초기화 함수 (Hyperdrive 우선)
function initializePool() {
  if (pool) return pool;

  try {
    const config = useRuntimeConfig();
    let dbConfig: any;

    // 1. Hyperdrive URL이 있으면 우선 사용
    if (config.hyperdriveUrl) {
      console.log('Using Hyperdrive connection');
      const hyperdriveConfig = parseHyperdriveUrl(config.hyperdriveUrl);

      if (hyperdriveConfig) {
        dbConfig = {
          ...hyperdriveConfig,
          waitForConnections: true,
          connectionLimit: 10, // Hyperdrive에서는 더 많은 연결 허용
          queueLimit: 0,
          acquireTimeout: 60000,
          timeout: 60000,
          reconnect: true,
          charset: 'utf8mb4',
          bigNumberStrings: true,
          supportBigNumbers: true,
          dateStrings: false,
          ssl: false,
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
      }
    }

    // 2. Hyperdrive가 없으면 기본 설정 사용
    if (!dbConfig) {
      console.log('Using direct database connection');
      dbConfig = {
        host: config.dbHost || process.env.DB_HOST || 'localhost',
        user: config.dbUser || process.env.DB_USER || 'root',
        password: config.dbPassword || process.env.DB_PASSWORD || '',
        database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
        port: parseInt(config.dbPort || process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 3, // 클라우드플레어에서는 더 적은 연결 수 사용
        queueLimit: 0,
        acquireTimeout: 30000, // 30초로 단축
        timeout: 30000, // 30초로 단축
        reconnect: true,
        charset: 'utf8mb4',
        bigNumberStrings: true,
        supportBigNumbers: true,
        dateStrings: false,
        ssl: false,
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
    }

    console.log('Initializing database pool with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
      connectionType: config.hyperdriveUrl ? 'Hyperdrive' : 'Direct'
    });

    pool = mysql.createPool(dbConfig);
    return pool;
  } catch (error) {
    console.error('Failed to initialize database pool:', error);
    pool = undefined;
    return undefined;
  }
}


// 간단한 쿼리 실행 함수 예제
export async function executeQuery<T>(sql: string, params?: any[]): Promise<T> {
  const currentPool = initializePool();

  if (!currentPool) {
    throw new Error('Database pool is not available'); // 또는 적절한 에러 처리
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
}

// DB 연결 테스트 함수
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
  config?: any;
}> {
  try {
    const currentPool = initializePool();

    if (!currentPool) {
      const config = useRuntimeConfig();
      return {
        success: false,
        message: 'Database pool is not available',
        details: 'Pool creation failed during initialization',
        config: {
          connectionType: config.hyperdriveUrl ? 'Hyperdrive' : 'Direct',
          host: config.dbHost || process.env.DB_HOST || 'localhost',
          user: config.dbUser || process.env.DB_USER || 'root',
          database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
          port: config.dbPort || process.env.DB_PORT || '3306',
          hyperdriveConfigured: !!config.hyperdriveUrl,
        }
      };
    }

    // 간단한 쿼리로 연결 테스트
    const [rows] = await currentPool.execute('SELECT 1 as test, NOW() as current_time');
    const config = useRuntimeConfig();

    return {
      success: true,
      message: 'Database connection successful',
      details: rows,
      config: {
        connectionType: config.hyperdriveUrl ? 'Hyperdrive' : 'Direct',
        host: config.dbHost || process.env.DB_HOST || 'localhost',
        user: config.dbUser || process.env.DB_USER || 'root',
        database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
        port: config.dbPort || process.env.DB_PORT || '3306',
        hyperdriveConfigured: !!config.hyperdriveUrl,
      }
    };
  } catch (error) {
    const config = useRuntimeConfig();
    return {
      success: false,
      message: 'Database connection failed',
      details: error.message,
      config: {
        connectionType: config.hyperdriveUrl ? 'Hyperdrive' : 'Direct',
        host: config.dbHost || process.env.DB_HOST || 'localhost',
        user: config.dbUser || process.env.DB_USER || 'root',
        database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
        port: config.dbPort || process.env.DB_PORT || '3306',
        hyperdriveConfigured: !!config.hyperdriveUrl,
      }
    };
  }
}

// pool getter 함수 export
export function getPool() {
  return initializePool();
}

export { pool };

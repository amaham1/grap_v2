import mysql, { FieldPacket } from 'mysql2/promise';

// 데이터베이스 연결 풀 생성
let pool: mysql.Pool | undefined;

// 풀 초기화 함수
function initializePool() {
  if (pool) return pool;

  try {
    // Nuxt Runtime Config에서 환경 변수 가져오기
    const config = useRuntimeConfig();

    const dbConfig = {
      host: config.dbHost || process.env.DB_HOST || 'localhost',
      user: config.dbUser || process.env.DB_USER || 'root',
      password: config.dbPassword || process.env.DB_PASSWORD || '',
      database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
      port: parseInt(config.dbPort || process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5, // 클라우드플레어에서는 연결 수를 줄임
      queueLimit: 0, // 0이면 무제한
      acquireTimeout: 60000, // 연결 획득 타임아웃 (60초)
      timeout: 60000, // 쿼리 타임아웃 (60초)
      reconnect: true, // 자동 재연결
      charset: 'utf8mb4',    // MySQL 연결 문자셋을 utf8mb4로 설정
      bigNumberStrings: true, // LONGLONG 또는 BIGINT를 문자열로 반환합니다.하도록 설정
      supportBigNumbers: true, // 큰 숫자 지원
      dateStrings: false, // 날짜를 문자열로 반환하지 않음
      ssl: false, // SSL 비활성화 (필요에 따라 조정)
      typeCast: function (field, next) {
        // VAR_STRING, VARCHAR, STRING, TEXT, BLOB 등의 타입들은 UTF-8로 변환
        if (field.type === 'VAR_STRING' || field.type === 'VARCHAR' || field.type === 'STRING' ||
            field.type === 'TEXT' || field.type === 'MEDIUMTEXT' || field.type === 'LONGTEXT' ||
            field.type === 'BLOB' || field.type === 'MEDIUMBLOB' || field.type === 'LONGBLOB') {
          const fieldBuffer = field.buffer();
          // fieldBuffer가 null이 아닐 때만 toString('utf8')을 호출합니다.
          // bigNumberStrings: true와 같은 옵션으로 인해 이미 문자열로 처리된 경우 buffer()가 null을 반환할 수 있습니다.
          if (fieldBuffer) {
            return fieldBuffer.toString('utf8');
          }
        }
        // bigNumberStrings: true 설정이 LONGLONG 등의 숫자형 큰 수를 문자열로 처리해주길 기대합니다.
        // 다른 타입들은 기본 처리(next())에 맡깁니다.
          return next();
      }
    };

    console.log('Initializing database pool with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
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
          host: config.dbHost || process.env.DB_HOST || 'localhost',
          user: config.dbUser || process.env.DB_USER || 'root',
          database: config.dbDatabase || process.env.DB_DATABASE || 'mydatabase',
          port: config.dbPort || process.env.DB_PORT || '3306',
          // 비밀번호는 보안상 표시하지 않음
        }
      };
    }

    // 간단한 쿼리로 연결 테스트
    const [rows] = await currentPool.execute('SELECT 1 as test');
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

// pool getter 함수 export
export function getPool() {
  return initializePool();
}

export { pool };

import mysql from 'mysql2/promise';

// .env 파일에서 환경 변수 읽기
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10, // 동시에 유지할 수 있는 최대 연결 수
  queueLimit: 0, // 연결 풀이 가득 찼을 때 대기열 제한 (0은 무제한)
};

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    try {
      pool = mysql.createPool(config);
      console.log('MySQL Connection Pool created successfully.');
    } catch (error) {
      console.error('Failed to create MySQL Connection Pool:', error);
      throw error; // 풀 생성 실패 시 에러 발생
    }
  }
  return pool;
}

// 데이터베이스 쿼리 실행 함수
export async function executeQuery<T>(query: string, params: any[] = []): Promise<T> {
  const currentPool = getPool();
  let connection;
  try {
    connection = await currentPool.getConnection();
    const [results] = await connection.execute(query, params);
    return results as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('An error occurred while executing the database query.');
  } finally {
    if (connection) {
      connection.release(); // 사용한 연결을 풀에 반환
    }
  }
}

// 간단한 연결 테스트 함수 (선택 사항)
export async function testConnection(): Promise<void> {
  try {
    const connection = await getPool().getConnection();
    console.log('Successfully connected to the database.');
    connection.release();
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    throw error;
  }
}

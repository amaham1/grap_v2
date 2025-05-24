import mysql, { FieldPacket } from 'mysql2/promise';
// import { createRequire } from 'node:module'; // Types를 직접 사용하지 않으므로 주석 처리 또는 제거 가능

// 데이터베이스 연결 풀 생성
// 실제 프로덕션 환경에서는 환경 변수에서 설정을 가져옵니다.
// 예: process.env.DB_HOST, process.env.DB_USER 등
let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'mydatabase',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0, // 0이면 무제한
    charset: 'utf8mb4',    // MySQL 연결 문자셋을 utf8mb4로 설정
    bigNumberStrings: true, // LONGLONG 또는 BIGINT를 문자열로 반환합니다.하도록 설정
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
  });
} catch (error) {
  // 에러 발생 시 pool을 undefined로 명시적으로 두거나, 혹은 애플리케이션을 중단시키는 등의 처리를 고려할 수 있습니다.
  pool = undefined; 
}


// 간단한 쿼리 실행 함수 예제
export async function executeQuery<T>(sql: string, params?: any[]): Promise<T> {
  if (!pool) {
    throw new Error('Database pool is not available.'); // 또는 적절한 에러 처리
  }
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export { pool };

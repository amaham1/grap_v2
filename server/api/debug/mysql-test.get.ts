
import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0
    }
  };

  // 테스트 1: 환경 변수 확인
  const envTest = {
    name: 'Environment Variables',
    status: 'unknown',
    details: {} as any
  };

  try {
    const config = useRuntimeConfig();
    envTest.details = {
      dbHost: config.dbHost || 'not set',
      dbUser: config.dbUser || 'not set',
      dbDatabase: config.dbDatabase || 'not set',
      dbPort: config.dbPort || 'not set',
      hasPassword: !!(config.dbPassword || process.env.DB_PASSWORD),
      hyperdriveUrl: config.hyperdriveUrl ? 'configured' : 'not configured'
    };
    envTest.status = 'passed';
  } catch (error) {
    envTest.status = 'failed';
    envTest.details.error = error.message;
  }

  results.tests.push(envTest);

  // 테스트 2: 기본 MySQL 연결 테스트
  const basicConnectionTest = {
    name: 'Basic MySQL Connection',
    status: 'unknown',
    details: {} as any
  };

  try {
    const config = useRuntimeConfig();
    const connectionConfig = {
      host: config.dbHost || process.env.DB_HOST,
      user: config.dbUser || process.env.DB_USER,
      password: config.dbPassword || process.env.DB_PASSWORD,
      database: config.dbDatabase || process.env.DB_DATABASE,
      port: parseInt(config.dbPort || process.env.DB_PORT || '3306'),
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 10000,
    };

    const connection = await mysql.createConnection(connectionConfig);
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time, VERSION() as mysql_version');
    await connection.end();

    basicConnectionTest.status = 'passed';
    basicConnectionTest.details = {
      connectionConfig: {
        host: connectionConfig.host,
        user: connectionConfig.user,
        database: connectionConfig.database,
        port: connectionConfig.port
      },
      queryResult: rows
    };
  } catch (error) {
    basicConnectionTest.status = 'failed';
    basicConnectionTest.details = {
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    };
  }

  results.tests.push(basicConnectionTest);

  // 테스트 3: 연결 풀 테스트
  const poolTest = {
    name: 'Connection Pool Test',
    status: 'unknown',
    details: {} as any
  };

  try {
    const config = useRuntimeConfig();
    const poolConfig = {
      host: config.dbHost || process.env.DB_HOST,
      user: config.dbUser || process.env.DB_USER,
      password: config.dbPassword || process.env.DB_PASSWORD,
      database: config.dbDatabase || process.env.DB_DATABASE,
      port: parseInt(config.dbPort || process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 2,
      queueLimit: 0,
      acquireTimeout: 10000,
      timeout: 10000,
    };

    const pool = mysql.createPool(poolConfig);
    const [rows] = await pool.execute('SELECT CONNECTION_ID() as connection_id, USER() as current_user');
    await pool.end();

    poolTest.status = 'passed';
    poolTest.details = {
      poolConfig: {
        host: poolConfig.host,
        user: poolConfig.user,
        database: poolConfig.database,
        port: poolConfig.port,
        connectionLimit: poolConfig.connectionLimit
      },
      queryResult: rows
    };
  } catch (error) {
    poolTest.status = 'failed';
    poolTest.details = {
      error: error.message,
      code: error.code,
      errno: error.errno
    };
  }

  results.tests.push(poolTest);

  // 테스트 4: 네트워크 연결 테스트 (TCP)
  const networkTest = {
    name: 'Network Connectivity',
    status: 'unknown',
    details: {} as any
  };

  try {
    const config = useRuntimeConfig();
    const host = config.dbHost || process.env.DB_HOST;
    const port = parseInt(config.dbPort || process.env.DB_PORT || '3306');

    // 간단한 TCP 연결 테스트
    const net = await import('net');
    const socket = new net.Socket();

    const connectPromise = new Promise((resolve, reject) => {
      socket.setTimeout(5000);
      socket.on('connect', () => {
        socket.destroy();
        resolve('connected');
      });
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      socket.on('error', (error) => {
        reject(error);
      });
      socket.connect(port, host);
    });

    await connectPromise;
    networkTest.status = 'passed';
    networkTest.details = {
      host,
      port,
      message: 'TCP connection successful'
    };
  } catch (error) {
    networkTest.status = 'failed';
    networkTest.details = {
      error: error.message,
      message: 'TCP connection failed - possible firewall or network issue'
    };
  }

  results.tests.push(networkTest);

  // 결과 요약
  results.summary.totalTests = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.status === 'passed').length;
  results.summary.failed = results.tests.filter(t => t.status === 'failed').length;

  // 권장사항 생성
  const recommendations = [];

  if (results.tests.find(t => t.name === 'Environment Variables' && t.status === 'failed')) {
    recommendations.push('환경 변수 설정을 확인하세요.');
  }

  if (results.tests.find(t => t.name === 'Network Connectivity' && t.status === 'failed')) {
    recommendations.push('네트워크 연결을 확인하세요. 방화벽이나 보안 그룹 설정을 점검해보세요.');
  }

  if (results.tests.find(t => t.name === 'Basic MySQL Connection' && t.status === 'failed')) {
    const mysqlTest = results.tests.find(t => t.name === 'Basic MySQL Connection');
    if (mysqlTest.details.code === 'ER_ACCESS_DENIED_ERROR') {
      recommendations.push('MySQL 사용자 인증 정보를 확인하세요.');
    } else if (mysqlTest.details.code === 'ECONNREFUSED') {
      recommendations.push('MySQL 서버가 실행 중인지 확인하세요.');
    } else if (mysqlTest.details.code === 'ENOTFOUND') {
      recommendations.push('MySQL 서버 호스트 주소를 확인하세요.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('모든 테스트가 통과했습니다!');
  }

  return {
    ...results,
    recommendations
  };
});

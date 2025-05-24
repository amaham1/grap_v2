import { executeQuery as executeQueryFromMysql } from './mysql';

/**
 * server/utils/mysql.ts의 executeQuery를 재노출합니다.
 * 점진적인 코드 수정을 위해 임시로 유지하며, 추후 모든 import를 './mysql'로 직접 변경하는 것을 권장합니다.
 */
export async function executeQuery<T>(query: string, params: any[] = []): Promise<T> {
  return executeQueryFromMysql<T>(query, params);
}

export async function testConnection(): Promise<void> {
  // 실제 연결 테스트가 필요하다면 mysql.ts의 연결 풀을 사용하는 로직으로 구현해야 합니다.
  // 간단히 executeQueryFromMysql을 호출하여 테스트할 수도 있습니다.
  try {
    await executeQueryFromMysql('SELECT 1');
  } catch (error) {
    throw error;
  }
}

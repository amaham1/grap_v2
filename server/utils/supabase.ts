// server/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = useRuntimeConfig().supabaseUrl
const supabaseServiceKey = useRuntimeConfig().supabaseServiceKey

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Key are required')
}

// 서버 사이드에서 사용할 Supabase 클라이언트 (Service Role Key 사용)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 클라이언트 사이드에서 사용할 Supabase 클라이언트 생성 함수
export function createSupabaseClient() {
  const config = useRuntimeConfig()
  return createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
}

// 데이터베이스 연결 테스트
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('gas_station_brands')
      .select('count(*)')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// 쿼리 실행 헬퍼 함수
export async function executeSupabaseQuery<T = any>(
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert',
  options: {
    select?: string
    data?: any
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean } | Array<{ column: string; ascending?: boolean }>
    limit?: number
    offset?: number
    onConflict?: string // upsert 시 conflict resolution 컬럼 지정
  } = {}
): Promise<{ data: T[] | null; error: any; count?: number }> {
  const queryStartTime = Date.now();

  console.log('🔧 [SUPABASE-DEBUG] 쿼리 실행 시작:', {
    tableName,
    operation,
    options: {
      ...options,
      data: options.data ? `[${Array.isArray(options.data) ? options.data.length : 1} items]` : undefined
    },
    timestamp: new Date().toISOString()
  });

  try {
    let query = supabase.from(tableName)
    let appliedFilters: string[] = [];

    switch (operation) {
      case 'select':
        query = query.select(options.select || '*', { count: 'exact' })

        // 필터 적용
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (typeof value === 'string' && value.includes('%')) {
                query = query.like(key, value)
                appliedFilters.push(`${key} LIKE '${value}'`);
              } else {
                query = query.eq(key, value)
                appliedFilters.push(`${key} = '${value}'`);
              }
            }
          })
        }

        // 정렬
        if (options.orderBy) {
          if (Array.isArray(options.orderBy)) {
            // 배열인 경우 여러 정렬 조건 적용
            options.orderBy.forEach(order => {
              query = query.order(order.column, { ascending: order.ascending ?? true })
            })
          } else {
            // 단일 객체인 경우
            query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
          }
        }

        // 페이징
        if (options.limit) {
          query = query.limit(options.limit)
        }
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
        }
        break

      case 'insert':
        query = query.insert(options.data)
        break

      case 'update':
        query = query.update(options.data)
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            query = query.eq(key, value)
            appliedFilters.push(`${key} = '${value}'`);
          })
        }
        break

      case 'delete':
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            query = query.eq(key, value)
            appliedFilters.push(`${key} = '${value}'`);
          })
        }
        query = query.delete()
        break

      case 'upsert':
        if (options.onConflict) {
          query = query.upsert(options.data, { onConflict: options.onConflict })
        } else {
          query = query.upsert(options.data)
        }
        break
    }

    console.log('🔧 [SUPABASE-DEBUG] 쿼리 구성 완료:', {
      tableName,
      operation,
      appliedFilters,
      select: options.select || '*',
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset
    });

    const result = await query

    console.log('🔧 [SUPABASE-DEBUG] 쿼리 실행 완료:', {
      tableName,
      operation,
      success: !result.error,
      dataCount: result.data?.length || 0,
      totalCount: result.count || 0,
      error: result.error?.message || null,
      queryTime: Date.now() - queryStartTime + 'ms'
    });

    return {
      data: result.data as T[],
      error: result.error,
      count: result.count || undefined
    }
  } catch (error) {
    console.error(`🔧 [SUPABASE-ERROR] ${operation} operation failed:`, {
      tableName,
      operation,
      error: error.message,
      queryTime: Date.now() - queryStartTime + 'ms'
    });
    return {
      data: null,
      error: error
    }
  }
}

// 배치 삽입/업데이트 헬퍼 함수
export async function batchUpsert<T = any>(
  tableName: string,
  data: T[],
  chunkSize: number = 1000,
  onConflict?: string
): Promise<{ success: boolean; error?: any; insertedCount?: number }> {
  try {
    let totalInserted = 0
    
    // 데이터를 청크 단위로 나누어 처리
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)

      let query = supabase.from(tableName)

      if (onConflict) {
        const { error } = await query.upsert(chunk, { onConflict })
        if (error) {
          console.error(`Batch upsert failed for chunk ${i / chunkSize + 1}:`, error)
          return { success: false, error }
        }
      } else {
        const { error } = await query.upsert(chunk)
        if (error) {
          console.error(`Batch upsert failed for chunk ${i / chunkSize + 1}:`, error)
          return { success: false, error }
        }
      }

      totalInserted += chunk.length
    }
    
    return { success: true, insertedCount: totalInserted }
  } catch (error) {
    console.error('Batch upsert error:', error)
    return { success: false, error }
  }
}

// 트랜잭션 헬퍼 함수 (Supabase는 기본적으로 트랜잭션을 지원하지 않으므로 순차 실행)
export async function executeTransaction(operations: Array<() => Promise<any>>): Promise<{ success: boolean; results?: any[]; error?: any }> {
  try {
    const results = []
    
    for (const operation of operations) {
      const result = await operation()
      if (result.error) {
        throw new Error(`Transaction failed: ${result.error.message}`)
      }
      results.push(result)
    }
    
    return { success: true, results }
  } catch (error) {
    console.error('Transaction failed:', error)
    return { success: false, error }
  }
}

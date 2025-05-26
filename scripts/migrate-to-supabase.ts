// scripts/migrate-to-supabase.ts
// MySQL에서 Supabase로 데이터 마이그레이션 스크립트

import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 환경 변수 로드 (상위 디렉토리의 .env 파일)
dotenv.config({ path: '../.env' })

// MySQL 연결 설정
const mysqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '3306')
}

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL and Service Key are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface MigrationStats {
  tableName: string
  totalRecords: number
  migratedRecords: number
  errors: number
  startTime: Date
  endTime?: Date
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateToSupabase() {
  console.log('🚀 Starting migration from MySQL to Supabase...')

  const stats: MigrationStats[] = []
  let mysqlConnection: mysql.Connection | null = null

  try {
    // MySQL 연결
    console.log('📡 Connecting to MySQL...')
    mysqlConnection = await mysql.createConnection(mysqlConfig)
    console.log('✅ MySQL connected successfully')

    // Supabase 연결 테스트
    console.log('📡 Testing Supabase connection...')
    const { error: testError } = await supabase
      .from('gas_station_brands')
      .select('*', { count: 'exact' })
      .limit(1)
    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`)
    }
    console.log('✅ Supabase connected successfully')

    // 테이블별 마이그레이션 실행
    const tables = [
      'gas_station_brands',
      'gas_stations',
      'gas_prices',
      'exhibitions',
      'festivals',
      'welfare_services'
    ]

    for (const tableName of tables) {
      console.log(`\n📋 Migrating table: ${tableName}`)
      const tableStat = await migrateTable(mysqlConnection, tableName)
      stats.push(tableStat)
    }

    // 마이그레이션 결과 출력
    console.log('\n📊 Migration Summary:')
    console.log('=' .repeat(80))

    let totalRecords = 0
    let totalMigrated = 0
    let totalErrors = 0

    stats.forEach(stat => {
      const duration = stat.endTime
        ? ((stat.endTime.getTime() - stat.startTime.getTime()) / 1000).toFixed(2)
        : 'N/A'

      console.log(`${stat.tableName.padEnd(20)} | ${stat.totalRecords.toString().padStart(8)} | ${stat.migratedRecords.toString().padStart(8)} | ${stat.errors.toString().padStart(6)} | ${duration}s`)

      totalRecords += stat.totalRecords
      totalMigrated += stat.migratedRecords
      totalErrors += stat.errors
    })

    console.log('=' .repeat(80))
    console.log(`${'TOTAL'.padEnd(20)} | ${totalRecords.toString().padStart(8)} | ${totalMigrated.toString().padStart(8)} | ${totalErrors.toString().padStart(6)} |`)

    if (totalErrors === 0) {
      console.log('\n🎉 Migration completed successfully!')
    } else {
      console.log(`\n⚠️  Migration completed with ${totalErrors} errors. Please check the logs.`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end()
      console.log('📡 MySQL connection closed')
    }
  }
}

/**
 * 개별 테이블 마이그레이션
 */
async function migrateTable(connection: mysql.Connection, tableName: string): Promise<MigrationStats> {
  const stat: MigrationStats = {
    tableName,
    totalRecords: 0,
    migratedRecords: 0,
    errors: 0,
    startTime: new Date()
  }

  try {
    // MySQL에서 데이터 조회
    const [rows] = await connection.execute(`SELECT * FROM ${tableName}`)
    const records = rows as any[]

    stat.totalRecords = records.length
    console.log(`  📊 Found ${records.length} records in ${tableName}`)

    if (records.length === 0) {
      stat.endTime = new Date()
      return stat
    }

    // 배치 크기 설정
    const batchSize = 1000
    const batches = Math.ceil(records.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, records.length)
      const batch = records.slice(start, end)

      console.log(`  📦 Processing batch ${i + 1}/${batches} (${batch.length} records)`)

      try {
        // 테이블별 데이터 변환
        const transformedBatch = transformDataForSupabase(tableName, batch)

        // Supabase에 삽입
        const { error } = await supabase
          .from(tableName)
          .upsert(transformedBatch)

        if (error) {
          console.error(`  ❌ Batch ${i + 1} failed:`, error.message)
          stat.errors += batch.length
        } else {
          stat.migratedRecords += batch.length
          console.log(`  ✅ Batch ${i + 1} completed`)
        }
      } catch (batchError) {
        console.error(`  ❌ Batch ${i + 1} error:`, batchError)
        stat.errors += batch.length
      }
    }

  } catch (error) {
    console.error(`  ❌ Table ${tableName} migration failed:`, error)
    stat.errors = stat.totalRecords
  }

  stat.endTime = new Date()
  return stat
}

/**
 * MySQL 데이터를 Supabase 형식으로 변환
 */
function transformDataForSupabase(tableName: string, records: any[]): any[] {
  return records.map(record => {
    const transformed = { ...record }

    // 날짜 필드 변환
    Object.keys(transformed).forEach(key => {
      if (transformed[key] instanceof Date) {
        transformed[key] = transformed[key].toISOString()
      }
    })

    // 테이블별 특별 처리
    switch (tableName) {
      case 'festivals':
        // JSON 필드 처리
        if (typeof transformed.files_info === 'string') {
          try {
            transformed.files_info = JSON.parse(transformed.files_info)
          } catch {
            transformed.files_info = []
          }
        }
        if (typeof transformed.api_raw_data === 'string') {
          try {
            transformed.api_raw_data = JSON.parse(transformed.api_raw_data)
          } catch {
            transformed.api_raw_data = {}
          }
        }
        break

      case 'welfare_services':
        // JSON 필드 처리
        if (typeof transformed.api_raw_data === 'string') {
          try {
            transformed.api_raw_data = JSON.parse(transformed.api_raw_data)
          } catch {
            transformed.api_raw_data = {}
          }
        }
        break

      case 'gas_stations':
      case 'gas_prices':
        // 숫자 필드 확인
        if (transformed.latitude) transformed.latitude = parseFloat(transformed.latitude)
        if (transformed.longitude) transformed.longitude = parseFloat(transformed.longitude)
        if (transformed.katec_x) transformed.katec_x = parseFloat(transformed.katec_x)
        if (transformed.katec_y) transformed.katec_y = parseFloat(transformed.katec_y)
        break
    }

    return transformed
  })
}

// 스크립트 실행
migrateToSupabase().catch(console.error)

export { migrateToSupabase }

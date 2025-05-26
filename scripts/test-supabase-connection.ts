// scripts/test-supabase-connection.ts
// Supabase 연결 테스트 스크립트

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 환경 변수 로드 (상위 디렉토리의 .env 파일)
dotenv.config({ path: '../.env' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL and Service Key are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  console.log('🔗 Testing Supabase connection...')
  console.log(`📍 URL: ${supabaseUrl}`)

  try {
    // 1. 기본 연결 테스트
    const { data, error } = await supabase
      .from('gas_station_brands')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      console.error('❌ Connection test failed:', error.message)

      // 테이블이 없는 경우 스키마 생성 안내
      if (error.message.includes('relation "gas_station_brands" does not exist')) {
        console.log('\n📋 Database schema not found. Please run the following SQL in Supabase SQL Editor:')
        console.log('   1. Go to Supabase Dashboard > SQL Editor')
        console.log('   2. Copy and paste the content from database/supabase_schema.sql')
        console.log('   3. Run the SQL script')
        console.log('   4. Then run this test again')
      }

      return false
    }

    console.log('✅ Supabase connection successful!')

    // 2. 테이블 목록 확인
    console.log('\n📊 Checking database tables...')
    const tables = [
      'gas_station_brands',
      'gas_stations',
      'gas_prices',
      'exhibitions',
      'festivals',
      'welfare_services',
      'api_logs'
    ]

    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1)

        if (tableError) {
          console.log(`❌ Table '${table}' not found`)
        } else {
          console.log(`✅ Table '${table}' exists`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed`)
      }
    }

    // 3. 브랜드 데이터 확인
    console.log('\n🏷️  Checking gas station brands data...')
    const { data: brands, error: brandsError } = await supabase
      .from('gas_station_brands')
      .select('*')

    if (brandsError) {
      console.log('❌ Failed to fetch brands:', brandsError.message)
    } else {
      console.log(`✅ Found ${brands?.length || 0} gas station brands`)
      if (brands && brands.length > 0) {
        console.log('   Sample brands:', brands.slice(0, 3).map(b => b.brand_name).join(', '))
      }
    }

    return true

  } catch (error) {
    console.error('❌ Connection test error:', error)
    return false
  }
}

// 스크립트 실행
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! Supabase is ready for migration.')
  } else {
    console.log('\n⚠️  Please fix the issues above before proceeding with migration.')
  }
  process.exit(success ? 0 : 1)
}).catch(console.error)

export { testConnection }

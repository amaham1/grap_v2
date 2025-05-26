// scripts/update-dao-imports.ts
// MySQL DAO import를 Supabase DAO import로 일괄 변경하는 스크립트

import * as fs from 'fs'
import * as path from 'path'

const serverApiDir = path.join(process.cwd(), '..', 'server', 'api')

// 변경할 import 매핑
const importMappings = [
  {
    from: "import { executeQuery } from '~/server/utils/db';",
    to: ""
  },
  {
    from: "import { executeQuery } from '~/server/utils/mysql';",
    to: ""
  },
  {
    from: "import { festivalDAO, exhibitionDAO, welfareServiceDAO, gasStationDAO, logDAO } from '~/server/dao';",
    to: "import { festivalDAO, exhibitionDAO, welfareServiceDAO, gasStationDAO, logDAO } from '~/server/dao/supabase';"
  },
  {
    from: "import { festivalDAO } from '~/server/dao';",
    to: "import { festivalDAO } from '~/server/dao/supabase';"
  },
  {
    from: "import { exhibitionDAO } from '~/server/dao';",
    to: "import { exhibitionDAO } from '~/server/dao/supabase';"
  },
  {
    from: "import { welfareServiceDAO } from '~/server/dao';",
    to: "import { welfareServiceDAO } from '~/server/dao/supabase';"
  },
  {
    from: "import { gasStationDAO } from '~/server/dao';",
    to: "import { gasStationDAO } from '~/server/dao/supabase';"
  },
  {
    from: "import { logDAO } from '~/server/dao';",
    to: "import { logDAO } from '~/server/dao/supabase';"
  }
]

function updateFile(filePath: string) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false

    // import 문 변경
    for (const mapping of importMappings) {
      if (content.includes(mapping.from)) {
        content = content.replace(mapping.from, mapping.to)
        changed = true
        console.log(`✅ Updated import in ${filePath}`)
      }
    }

    // MySQL 관련 코드 패턴 제거/변경
    if (content.includes('mysql.Connection')) {
      content = content.replace(/mysql\.Connection/g, 'any')
      changed = true
    }

    if (content.includes('import mysql from')) {
      content = content.replace(/import mysql from [^;]+;/g, '')
      changed = true
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`📝 Updated file: ${filePath}`)
    }

  } catch (error) {
    console.error(`❌ Error updating file ${filePath}:`, error.message)
  }
}

function walkDirectory(dir: string) {
  try {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        walkDirectory(filePath)
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        updateFile(filePath)
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message)
  }
}

console.log('🚀 Starting DAO import updates...')
walkDirectory(serverApiDir)
console.log('✅ DAO import updates completed!')

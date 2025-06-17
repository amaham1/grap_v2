# 🏝️ GRAP v2 - 제주도 생활정보 통합 플랫폼

> **제주도 주유소 최저가 정보, 축제, 전시회, 복지서비스를 한곳에서 확인하는 종합 생활정보 플랫폼**

[![Deployment Status](https://img.shields.io/badge/deployment-live-brightgreen)](https://grap.co.kr)
[![Tech Stack](https://img.shields.io/badge/tech-Nuxt3%20%7C%20Vue3%20%7C%20Cloudflare-blue)](#기술-스택)
[![Database](https://img.shields.io/badge/database-Supabase-green)](https://supabase.com)
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

## 📖 프로젝트 개요

GRAP v2는 제주도 거주민과 관광객을 위한 종합 생활정보 플랫폼입니다. 실시간 주유소 가격 정보, 문화 행사, 복지 서비스 등 제주도 생활에 필요한 모든 정보를 통합적으로 제공합니다.

### 🎯 핵심 가치
- **실시간 정보**: 제주도 공공 API를 통한 최신 데이터 제공
- **사용자 중심**: 직관적인 UI/UX와 모바일 최적화
- **지역 특화**: 제주도 지역 특성을 반영한 맞춤형 서비스
- **성능 최적화**: Cloudflare Workers 기반 글로벌 CDN 활용

## 🚀 기술 스택

### Frontend
- **Framework**: Nuxt 3.17.3 (Vue 3.5.13 기반)
- **Styling**: TailwindCSS 6.14.0
- **State Management**: Pinia 3.0.2
- **Image Optimization**: @nuxt/image 1.10.0
- **TypeScript**: 완전한 타입 안전성 지원

### Backend & Infrastructure
- **Server Engine**: Nitro (SSR + API Routes)
- **Database**: Supabase (PostgreSQL) + Row Level Security
- **Deployment**: Cloudflare Workers (cloudflare_module preset)
- **CDN**: Cloudflare Global Network
- **Monitoring**: Supabase Analytics + Cloudflare Analytics

### External APIs & Services
- **Maps**: Kakao Map API (지도 및 좌표 변환)
- **Data Sources**: 제주도 공공 API (주유소, 축제, 전시회, 복지서비스)
- **Monetization**: Google AdSense (자동 광고)
- **SEO**: Google Search Console + Naver 웹마스터 도구

### Development & DevOps
- **Package Manager**: Yarn 4.9.1
- **Build Tool**: Vite (Nuxt 내장)
- **Deployment Tool**: Wrangler 4.16.1
- **Code Quality**: TypeScript Strict Mode + ESLint
- **Automation**: GitHub Actions (Cron Jobs)

## 📋 주요 기능

### 🏪 주유소 정보 서비스
- **실시간 가격 정보**: 휘발유, 경유, LPG 가격 비교
- **지도 기반 검색**: 카카오맵 연동으로 위치 기반 주유소 찾기
- **최저가 TOP 리스트**: 연료별 최저가 주유소 순위
- **즐겨찾기 기능**: 자주 이용하는 주유소 저장 (로컬 스토리지)
- **모바일 최적화**: 반응형 UI와 터치 친화적 인터페이스
- **좌표 변환**: KATEC → WGS84 자동 변환

### 🎉 문화 정보 서비스
- **축제 정보**: 제주도 내 진행되는 축제 및 행사 정보
- **전시회/공연**: 문화 예술 행사 및 공연 정보
- **상세 정보**: 일정, 장소, 요금, 주최자 정보 제공
- **검색 및 필터링**: 날짜, 카테고리별 정보 검색

### 🏛️ 복지 서비스
- **복지 정보**: 제주도 복지 서비스 및 지원 정책 정보
- **지역별 분류**: 제주시/서귀포시/전체 지역별 서비스 구분
- **신청 정보**: 지원 대상, 내용, 신청 방법 상세 안내

### 👨‍💼 관리자 시스템
- **데이터 관리**: 수집된 정보의 노출 여부 관리
- **API 로그 모니터링**: 외부 API 호출 상태 및 에러 추적
- **시스템 상태 확인**: 데이터베이스 연결 및 서비스 상태 모니터링
- **수동 데이터 동기화**: 필요시 수동으로 데이터 업데이트 실행

### 🔧 기술적 특징
- **SEO 최적화**: 동적 메타태그, 구조화된 데이터, XML 사이트맵
- **성능 최적화**: 컴포넌트 지연 로딩, 이미지 최적화, CDN 캐싱
- **보안**: JWT 인증, HTTPS 강제, Mixed Content 해결
- **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 지원
- **에러 처리**: 통합 에러 핸들링 및 사용자 친화적 에러 메시지

## 🏗️ 프로젝트 아키텍처

### 시스템 구조도
```
┌─────────────────┐    HTTPS     ┌──────────────────────────────────────┐    DB Connection    ┌─────────────────┐
│ 외부 공공 API   │ ◄──────────► │ Nuxt.js 애플리케이션                  │ ◄─────────────────► │ Supabase DB     │
│ (제주도 정부)   │              │ (Nitro 서버 + Vue 프론트엔드)         │                     │ (PostgreSQL)    │
└─────────────────┘              │                                      │                     └─────────────────┘
                                 │ ┌──────────────────────────────────┐ │
┌─────────────────┐              │ │ Server API Layer                 │ │    ┌─────────────────┐
│ Kakao Map API   │ ◄──────────► │ │ - 크론 작업 (데이터 수집)         │ │ ◄─► │ Cloudflare      │
│ (지도/좌표변환) │              │ │ - 공공 API 프록시                │ │    │ Workers Runtime │
└─────────────────┘              │ │ - 인증 및 관리자 API             │ │    └─────────────────┘
                                 │ └──────────────────────────────────┘ │
┌─────────────────┐              │ ┌──────────────────────────────────┐ │
│ Google AdSense  │ ◄──────────► │ │ Client Layer                     │ │
│ (광고 서비스)   │              │ │ - Vue 3 컴포넌트                 │ │
└─────────────────┘              │ │ - Pinia 상태 관리                │ │
                                 │ │ - TailwindCSS 스타일링           │ │
                                 │ └──────────────────────────────────┘ │
                                 └──────────────────────────────────────┘
```

### 데이터 플로우
1. **데이터 수집**: GitHub Actions → Cloudflare Cron → 제주도 API → Supabase
2. **사용자 요청**: 브라우저 → Cloudflare CDN → Nuxt SSR → Supabase
3. **지도 서비스**: 클라이언트 → Kakao API (좌표 변환 및 지도 렌더링)

## 📁 프로젝트 구조

```
grap_v2/
├── 📁 pages/                    # 페이지 컴포넌트 (Nuxt 라우팅)
│   ├── index.vue               # 메인 페이지 (→ /alljeju 리다이렉트)
│   ├── 📁 alljeju/             # 공개 서비스 페이지
│   │   ├── index.vue           # 서비스 메인 페이지
│   │   ├── 📁 gas-stations/    # 주유소 서비스
│   │   ├── 📁 festivals/       # 축제 정보
│   │   ├── 📁 exhibitions/     # 전시회 정보
│   │   └── 📁 welfare-services/# 복지 서비스
│   └── 📁 admin/               # 관리자 페이지
├── 📁 components/              # Vue 컴포넌트
│   ├── 📁 GasStation/          # 주유소 관련 컴포넌트
│   ├── 📁 common/              # 공통 컴포넌트
│   └── 📁 public/              # 공개 서비스 컴포넌트
├── 📁 server/                  # 서버 사이드 코드
│   ├── 📁 api/                 # API 엔드포인트
│   │   ├── 📁 public/          # 공개 API
│   │   ├── 📁 admin/           # 관리자 API
│   │   ├── 📁 cron/            # 크론 작업 API
│   │   └── 📁 auth/            # 인증 API
│   ├── 📁 dao/                 # 데이터 접근 객체
│   ├── 📁 middleware/          # 서버 미들웨어
│   └── 📁 utils/               # 서버 유틸리티
├── 📁 composables/             # Vue 컴포저블
├── 📁 stores/                  # Pinia 스토어
├── 📁 layouts/                 # 레이아웃 컴포넌트
├── 📁 middleware/              # 라우트 미들웨어
├── 📁 types/                   # TypeScript 타입 정의
├── 📁 utils/                   # 클라이언트 유틸리티
├── 📁 database/                # 데이터베이스 스키마
├── 📁 scripts/                 # 개발/배포 스크립트
├── 📁 public/                  # 정적 파일
└── 📁 workers/                 # Cloudflare Workers 설정
```

## 🛠️ 설치 및 설정

### 1. 저장소 클론 및 의존성 설치

```bash
# 저장소 클론
git clone https://github.com/amaham1/grap_v2.git
cd grap_v2

# 의존성 설치 (Yarn 권장)
yarn install
# 또는 npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Supabase 설정
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT 인증 설정
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 카카오 맵 API 키
KAKAO_MAP_API_KEY=your_kakao_map_api_key

# 데이터베이스 설정 (선택사항 - Supabase 사용 시 불필요)
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=grap_v2
DB_PORT=5432

# Cloudflare 설정 (배포 시 필요)
HYPERDRIVE_URL=your_hyperdrive_url_if_using
```

### 3. 데이터베이스 설정

```bash
# Supabase 연결 테스트
npm run test:supabase

# 데이터베이스 마이그레이션 (필요시)
npm run migrate:supabase
```

## 🚀 개발 서버 실행

```bash
# 개발 서버 시작 (http://localhost:3000)
npm run dev

# 또는 Yarn 사용
yarn dev
```

## 📊 데이터베이스 스키마

### 주요 테이블 구조

#### 1. 주유소 정보 (`gas_stations`)
```sql
- id: 기본키
- opinet_id: 오피넷 고유 ID (외부 API 키)
- station_name: 주유소 상호명
- brand_code/brand_name: 브랜드 정보
- address: 주소
- katec_x/katec_y: 카텍 좌표
- latitude/longitude: WGS84 좌표
- is_exposed: 노출 여부 (관리자 제어)
```

#### 2. 주유소 가격 정보 (`gas_prices`)
```sql
- opinet_id: 주유소 연결키
- gasoline_price: 휘발유 가격
- premium_gasoline_price: 고급 휘발유 가격
- diesel_price: 경유 가격
- lpg_price: LPG 가격
- price_date: 가격 기준일
- updated_at: 업데이트 시간
```

#### 3. 문화 정보 테이블
- `festivals`: 축제/행사 정보
- `exhibitions`: 전시회/공연 정보
- `welfare_services`: 복지 서비스 정보

#### 4. 시스템 테이블
- `users`: 관리자 계정
- `api_logs`: API 호출 로그
- `system_error_logs`: 시스템 에러 로그

## 🔄 데이터 수집 및 업데이트

### 자동화된 데이터 수집
- **주유소 데이터**: 매일 새벽 2시 (KST) 자동 수집
- **문화 정보**: 매일 오전 9시 (KST) 자동 수집
- **수집 방식**: GitHub Actions → Cloudflare Cron → 제주도 API

### 크론 작업 설정
```yaml
# .github/workflows/cron-jobs.yml
schedule:
  - cron: '0 17 * * *'  # 주유소 (새벽 2시 KST)
  - cron: '0 0 * * *'   # 문화정보 (오전 9시 KST)
```

### 수동 데이터 업데이트
```bash
# 관리자 페이지에서 수동 실행 가능
# 또는 API 직접 호출
curl -X POST https://grap.co.kr/api/admin/manual-sync-gas-stations
```

## 🔍 SEO 최적화

### 검색 엔진 최적화 기능
- **동적 메타태그**: 페이지별 맞춤형 title, description, keywords
- **구조화된 데이터**: JSON-LD 스키마 (LocalBusiness, Event 등)
- **XML 사이트맵**: 실시간 콘텐츠 반영 자동 생성
- **Open Graph**: 소셜 미디어 공유 최적화
- **지역 SEO**: 제주도 특화 키워드 최적화

### 주요 타겟 키워드
```
주유소: "제주도 주유소", "제주 최저가 주유소", "제주도 유가"
지역별: "제주시 주유소", "서귀포시 주유소", "애월 주유소"
브랜드: "SK에너지 제주", "GS칼텍스 제주", "S-OIL 제주"
연료별: "제주도 휘발유", "제주 경유", "제주도 LPG"
```

### SEO 관련 파일
- `server/api/sitemap.xml.get.ts`: 동적 사이트맵 생성
- `composables/useSEO.ts`: SEO 최적화 컴포저블
- `public/robots.txt`: 검색 엔진 크롤링 가이드
- `public/google-site-verification.html`: Google Search Console
- `public/naver-site-verification.html`: Naver 웹마스터 도구

## 🔒 보안 및 Mixed Content 해결

### Cloudflare Mixed Content 정책 해결
HTTPS 환경에서 HTTP API 호출 문제를 다음과 같이 해결했습니다:

#### 1. 서버 사이드 프록시 패턴
```
클라이언트 (HTTPS) → 내부 API (HTTPS) → 외부 HTTP API (서버 사이드)
```

#### 2. 보안 구현 사항
- **HTTP API 격리**: 모든 외부 HTTP API 호출을 서버 사이드에서만 수행
- **전용 클라이언트**: `server/utils/httpApiClient.ts`로 안전한 HTTP 호출
- **에러 핸들링**: 타임아웃, 재시도, 상세 로깅 포함
- **CSP 헤더**: Content Security Policy로 추가 보안 강화

#### 3. 인증 및 권한 관리
- **JWT 토큰**: 관리자 인증에 JWT 사용
- **미들웨어**: 라우트별 접근 권한 제어
- **RLS**: Supabase Row Level Security 정책 적용

## 🏗️ 빌드 및 배포

### 로컬 빌드 테스트
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### Cloudflare Workers 배포

#### 1. Cloudflare 로그인
```bash
npm run login:cloudflare
```

#### 2. 로컬 미리보기 (Cloudflare Workers 환경)
```bash
npm run preview:cloudflare
```

#### 3. 프로덕션 배포
```bash
npm run deploy:cloudflare
```

### 환경 변수 설정 (프로덕션)

#### Cloudflare 대시보드 방식
1. Cloudflare Dashboard → Workers & Pages
2. 프로젝트 선택 → Settings → Environment Variables
3. 필요한 환경 변수 추가

#### Wrangler CLI 방식
```bash
# 민감한 정보는 secret으로 설정
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put JWT_SECRET_KEY

# 일반 환경 변수는 vars로 설정
npx wrangler vars put SUPABASE_URL "https://your-project.supabase.co"
```

### 배포 설정 파일

#### `nuxt.config.ts` - Nitro 설정
```typescript
nitro: {
  preset: 'cloudflare_module',  // 최신 Workers 방식
  compatibilityDate: '2024-09-19',
  cloudflare: {
    deployConfig: true,
    nodeCompat: true
  }
}
```

#### `wrangler.toml` - Workers 설정 (자동 생성)
```toml
name = "grap-v2"
compatibility_date = "2024-09-19"
compatibility_flags = ["nodejs_compat"]
```

## 💰 Google AdSense 설정

### 자동 광고 구현
- **Publisher ID**: `ca-pub-6491895061878011`
- **광고 유형**: 자동 광고 (Google AI 기반 최적 배치)
- **반응형 디자인**: 모든 디바이스 자동 최적화
- **성능 최적화**: 사용자 경험 우선 배치

### 설정 파일
- `public/ads.txt`: AdSense 인증 파일
- `nuxt.config.ts`: 자동 광고 스크립트 전역 로드

## 📚 상세 문서

### 배포 및 설정 가이드
- [📖 배포 가이드](./DEPLOYMENT_GUIDE.md) - 전체 배포 프로세스
- [☁️ Cloudflare Workers 배포](./CLOUDFLARE_WORKERS_DEPLOYMENT.md) - Workers 특화 가이드
- [⏰ 크론 작업 설정](./CRON_SETUP.md) - 자동화 작업 설정
- [💰 Google AdSense 설정](./ADSENSE_SETUP.md) - 광고 설정 가이드

### API 문서
- [🔗 API 엔드포인트](./API_ENDPOINTS.md) - 전체 API 명세
- [📊 데이터베이스 스키마](./database/supabase_schema.sql) - DB 구조

## 🔧 NPM 스크립트

### 개발 관련
```bash
npm run dev                    # 개발 서버 시작 (localhost:3000)
npm run build                  # 프로덕션 빌드
npm run preview               # 빌드 결과 미리보기
```

### Cloudflare Workers 관련
```bash
npm run login:cloudflare      # Cloudflare 로그인
npm run preview:cloudflare    # Workers 환경 로컬 미리보기
npm run deploy:cloudflare     # 프로덕션 배포
```

### 데이터베이스 관련
```bash
npm run test:supabase         # Supabase 연결 테스트
npm run migrate:supabase      # 데이터 마이그레이션
npm run update:dao            # DAO 임포트 업데이트
```

## 🌐 배포 정보

### 프로덕션 환경
- **🌍 사이트 URL**: [grap.co.kr](https://grap.co.kr)
- **☁️ 플랫폼**: Cloudflare Workers (cloudflare_module preset)
- **🗄️ 데이터베이스**: Supabase (PostgreSQL)
- **🚀 CDN**: Cloudflare Global Network
- **📊 모니터링**: Cloudflare Analytics + Supabase Dashboard

### 성능 특징
- **⚡ 콜드 스타트**: < 100ms (Cloudflare Workers)
- **🌍 글로벌 배포**: 200+ 데이터센터
- **📱 모바일 최적화**: 반응형 디자인 + 터치 UI
- **🔍 SEO 점수**: 95+ (Google PageSpeed Insights)

## 🎉 주요 업데이트 (v2.0)

### ✅ 완료된 주요 기능

#### 1. 최신 기술 스택 적용
- **Nuxt 3.17.3**: 최신 Vue 3.5.13 기반
- **Cloudflare Workers**: `cloudflare_module` preset 사용
- **TypeScript**: 완전한 타입 안전성
- **Pinia**: Vue 3 공식 상태 관리

#### 2. 성능 최적화
- **컴포넌트 지연 로딩**: 초기 로딩 시간 단축
- **이미지 최적화**: @nuxt/image 모듈 활용
- **CDN 캐싱**: Cloudflare 글로벌 캐시
- **번들 최적화**: Tree-shaking 및 코드 분할

#### 3. 사용자 경험 개선
- **반응형 디자인**: 모바일 퍼스트 접근
- **직관적 UI**: 한국형 디자인 패턴 적용
- **접근성**: WCAG 2.1 가이드라인 준수
- **성능 모니터링**: 실시간 성능 추적

#### 4. 개발자 경험 향상
- **타입 안전성**: 엄격한 TypeScript 설정
- **코드 품질**: ESLint + Prettier 적용
- **자동화**: GitHub Actions 기반 CI/CD
- **문서화**: 상세한 개발 가이드 제공

## 🛠️ 개발 가이드

### 코드 구조 및 컨벤션

#### 1. 컴포넌트 구조
```vue
<!-- 컴포넌트 예시 -->
<template>
  <!-- UI 구조 -->
</template>

<script setup lang="ts">
// 타입 안전한 스크립트
import type { ComponentType } from '~/types'

// 컴포저블 사용
const { data, loading } = useAsyncData()
</script>

<style scoped>
/* TailwindCSS 우선 사용 */
</style>
```

#### 2. API 라우트 구조
```typescript
// server/api/example.get.ts
export default defineEventHandler(async (event) => {
  try {
    // 비즈니스 로직
    const result = await someOperation()
    return { success: true, data: result }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
```

#### 3. 타입 정의
```typescript
// types/example.ts
export interface GasStation {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  prices: GasPrice[]
}
```

### 성능 최적화 가이드

#### 1. 컴포넌트 최적화
- `defineAsyncComponent()` 사용으로 지연 로딩
- `shallowRef()` 사용으로 불필요한 반응성 방지
- `v-memo` 디렉티브로 렌더링 최적화

#### 2. 데이터 페칭 최적화
- `useFetch()` 컴포저블 활용
- 적절한 캐싱 전략 적용
- 페이지네이션으로 대용량 데이터 처리

#### 3. 번들 최적화
- Tree-shaking 활용
- 동적 임포트 사용
- 불필요한 의존성 제거

## 🔍 문제 해결

### 자주 발생하는 문제들

#### 1. 카카오맵이 로드되지 않는 경우
```bash
# API 키 확인
curl https://grap.co.kr/api/debug/environment

# 브라우저 콘솔에서 에러 확인
# F12 → Console 탭
```

#### 2. 데이터베이스 연결 오류
```bash
# Supabase 연결 테스트
npm run test:supabase

# 환경 변수 확인
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### 3. 빌드 오류
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 타입 체크
npx tsc --noEmit
```

### 로그 및 디버깅

#### 1. 서버 로그 확인
```bash
# Cloudflare Workers 로그
npx wrangler tail

# 로컬 개발 서버 로그
npm run dev
```

#### 2. 데이터베이스 로그
- Supabase Dashboard → Logs 섹션
- API 호출 및 에러 로그 확인

## 🤝 기여 가이드

### 개발 워크플로우
1. **이슈 생성**: 기능 요청 또는 버그 리포트
2. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명`
3. **개발 및 테스트**: 로컬 환경에서 개발
4. **Pull Request**: 코드 리뷰 요청
5. **배포**: 승인 후 main 브랜치 병합

### 코드 스타일
- **TypeScript**: 엄격한 타입 체크
- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **Conventional Commits**: 커밋 메시지 규칙

## 📞 지원 및 문의

### 개발팀 연락처
- **GitHub Issues**: [프로젝트 이슈 페이지](https://github.com/amaham1/grap_v2/issues)
- **이메일**: akapwhd@gmail.com

### 유용한 링크
- **Nuxt 3 문서**: https://nuxt.com/docs
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Supabase 문서**: https://supabase.com/docs
- **카카오맵 API**: https://apis.map.kakao.com/

## 📄 라이선스

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다.

```
MIT License

Copyright (c) 2024 GRAP Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**🏝️ 제주도 생활을 더 편리하게, GRAP과 함께하세요! 🏝️**

[![Website](https://img.shields.io/badge/🌐-grap.co.kr-blue)](https://grap.co.kr)
[![GitHub](https://img.shields.io/badge/GitHub-grap__v2-black)](https://github.com/amaham1/grap_v2)

</div>

# GRAP v2 - 제주도 주유소 및 관광정보 플랫폼

제주도 주유소 정보와 축제, 전시회, 복지서비스 정보를 제공하는 통합 플랫폼입니다.

## 🚀 기술 스택

- **Frontend**: Nuxt 3, Vue 3, TailwindCSS
- **Backend**: Nitro (Server-side rendering)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Cloudflare Workers
- **Maps**: Kakao Map API
- **Ads**: Google AdSense

## 📋 주요 기능

- 🏪 제주도 주유소 실시간 정보 및 지도 표시
- 🎉 제주도 축제 정보
- 🎨 전시회 정보
- 🏛️ 복지서비스 정보
- 👨‍💼 관리자 대시보드
- 📱 반응형 웹 디자인
- 🔍 검색 및 필터링 기능

## 🛠️ 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```bash
cp .env.example .env
```

필요한 환경 변수:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
- `KAKAO_MAP_API_KEY`: 카카오 맵 API 키
- `JWT_SECRET_KEY`: JWT 시크릿 키

## 🚀 개발 서버

로컬 개발 서버를 시작합니다 (`http://localhost:3000`):

```bash
npm run dev
```

## 🏗️ 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

### Cloudflare Workers 배포

#### 1. Cloudflare 로그인
```bash
npm run login:cloudflare
```

#### 2. 로컬 미리보기
```bash
npm run preview:cloudflare
```

#### 3. 프로덕션 배포
```bash
npm run deploy:cloudflare
```

### 환경 변수 설정 (프로덕션)

Cloudflare Workers 대시보드에서 환경 변수를 설정하거나 wrangler CLI를 사용하세요:

```bash
npx wrangler secret put SECRET_NAME
```

## 📚 문서

- [배포 가이드](./DEPLOYMENT_GUIDE.md)
- [Cloudflare Workers 배포](./CLOUDFLARE_WORKERS_DEPLOYMENT.md)
- [크론 작업 설정](./CRON_SETUP.md)
- [Google AdSense 설정](./ADSENSE_SETUP.md)

## 🔧 주요 스크립트

- `npm run dev`: 개발 서버 시작
- `npm run build`: 프로덕션 빌드
- `npm run preview:cloudflare`: Cloudflare Workers 로컬 미리보기
- `npm run deploy:cloudflare`: Cloudflare Workers 배포
- `npm run test:supabase`: Supabase 연결 테스트
- `npm run migrate:supabase`: Supabase 데이터 마이그레이션

## 🌐 배포 정보

- **프로덕션 사이트**: [grap.co.kr](https://grap.co.kr)
- **플랫폼**: Cloudflare Workers
- **데이터베이스**: Supabase
- **CDN**: Cloudflare

## 🎉 최신 업데이트 (Cloudflare Workers 배포)

### ✅ 완료된 작업들

1. **Nitro 설정 업데이트**
   - `cloudflare-pages`에서 `cloudflare_module`로 preset 변경
   - 호환성 날짜를 `2024-09-19`로 설정
   - Node.js 호환성 및 자동 배포 설정 활성화

2. **Wrangler 설정 파일 생성**
   - `wrangler.toml` 파일 생성으로 Workers 설정 관리
   - 환경 변수, 크론 작업, 바인딩 설정 예시 포함

3. **배포 스크립트 업데이트**
   - `npm run deploy:cloudflare`: Workers 배포
   - `npm run preview:cloudflare`: 로컬 미리보기
   - `npm run login:cloudflare`: Cloudflare 로그인

4. **문서 업데이트**
   - `CLOUDFLARE_WORKERS_DEPLOYMENT.md`: 상세한 Workers 배포 가이드
   - `DEPLOYMENT_GUIDE.md`: 기존 가이드를 Workers 방식으로 업데이트

### 🚀 주요 장점

- **최신 기술**: `cloudflare_module` preset 사용으로 최신 Workers 기능 활용
- **향상된 성능**: 더 빠른 콜드 스타트와 최적화된 번들 크기
- **Node.js 호환성**: 대부분의 Node.js 모듈 사용 가능
- **자동 설정**: Nitro가 자동으로 wrangler.json 생성
- **Static Assets**: 정적 파일 자동 처리

### 🔧 환경 변수 설정

프로덕션 배포 시 Cloudflare 대시보드에서 환경 변수를 설정하거나 wrangler CLI를 사용하세요:

```bash
npx wrangler secret put SECRET_NAME
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

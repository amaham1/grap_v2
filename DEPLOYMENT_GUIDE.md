# 클라우드플래어 Workers + Supabase 배포 가이드

이 가이드는 Nuxt.js 애플리케이션을 클라우드플래어 Workers에 배포하고 Supabase를 데이터베이스로 사용하는 방법을 설명합니다.

> **중요**: 이 프로젝트는 최신 Cloudflare Workers (`cloudflare_module` preset)를 사용합니다. 자세한 Workers 배포 정보는 `CLOUDFLARE_WORKERS_DEPLOYMENT.md`를 참조하세요.

## 1. Supabase 설정

### 1.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 리전 선택 (한국의 경우 Northeast Asia (Seoul) 권장)

### 1.2 데이터베이스 스키마 생성
1. Supabase 대시보드에서 "SQL Editor" 이동
2. `database/supabase_schema.sql` 파일의 내용을 복사하여 실행
3. 모든 테이블과 인덱스가 생성되었는지 확인

### 1.3 API 키 확인
1. Supabase 대시보드에서 "Settings" > "API" 이동
2. 다음 정보를 복사해 둡니다:
   - Project URL
   - anon public key
   - service_role secret key

## 2. 데이터 마이그레이션

### 2.1 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 입력:

```env
# Supabase 설정
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 기존 MySQL 설정 (마이그레이션용)
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_DATABASE=your_mysql_database
DB_PORT=3306

# JWT 설정
JWT_SECRET_KEY=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 카카오 맵 API 키
KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

### 2.2 마이그레이션 실행
```bash
npm run migrate:supabase
```

## 3. 클라우드플래어 Workers 설정

### 3.1 클라우드플래어 계정 설정
1. [Cloudflare](https://cloudflare.com)에 로그인
2. "Workers & Pages" 섹션으로 이동
3. "Create application" > "Create Worker" 클릭

### 3.2 Wrangler CLI 설정
```bash
# Wrangler 로그인
npm run login:cloudflare

# 로컬 미리보기
npm run preview:cloudflare

# 프로덕션 배포
npm run deploy:cloudflare
```

### 3.3 환경 변수 설정
클라우드플래어 Workers 대시보드에서 "Settings" > "Variables"에 다음 변수들을 추가:

**Production 환경:**
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET_KEY=your_jwt_secret_key
JWT_EXPIRES_IN=7d
KAKAO_MAP_API_KEY=your_kakao_map_api_key
NODE_ENV=production
```

## 4. GitHub Actions 자동 배포 (선택사항)

### 4.1 GitHub Secrets 설정
GitHub 리포지토리의 Settings > Secrets and variables > Actions에서 다음 시크릿을 추가:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API 토큰
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 계정 ID

### 4.2 GitHub Actions 워크플로우
`.github/workflows/deploy.yml` 파일을 생성하여 자동 배포 설정 가능

## 5. 도메인 설정

### 5.1 커스텀 도메인 연결
1. 클라우드플래어 Workers 대시보드에서 "Settings" > "Triggers" 클릭
2. "Custom Domains" 섹션에서 도메인 추가
3. DNS 설정 확인

### 5.2 SSL 인증서
클라우드플래어에서 자동으로 SSL 인증서를 제공합니다.

## 6. 성능 최적화

### 6.1 캐싱 설정
`_headers` 파일에서 정적 자산 캐싱 설정이 이미 구성되어 있습니다.

### 6.2 이미지 최적화
Nuxt Image 모듈이 자동으로 이미지를 최적화합니다.

## 7. 모니터링 및 로그

### 7.1 클라우드플래어 Analytics
클라우드플래어 대시보드에서 트래픽 및 성능 지표를 확인할 수 있습니다.

### 7.2 Supabase 모니터링
Supabase 대시보드에서 데이터베이스 사용량과 API 호출을 모니터링할 수 있습니다.

## 8. 문제 해결

### 8.1 빌드 오류
- Node.js 버전 확인 (18+ 권장)
- 의존성 설치 확인: `npm install`
- 환경 변수 설정 확인

### 8.2 데이터베이스 연결 오류
- Supabase URL과 API 키 확인
- 네트워크 연결 상태 확인
- RLS (Row Level Security) 정책 확인

### 8.3 API 오류
- 환경 변수가 올바르게 설정되었는지 확인
- CORS 설정 확인
- 클라우드플래어 Workers 로그 확인 (`wrangler tail` 명령어 사용)

## 9. 보안 고려사항

### 9.1 환경 변수 보안
- 민감한 정보는 절대 코드에 하드코딩하지 마세요
- 클라우드플래어 환경 변수를 사용하세요

### 9.2 Supabase RLS
필요에 따라 Row Level Security 정책을 설정하세요.

### 9.3 API 보안
- JWT 토큰 검증
- Rate limiting 설정
- CORS 정책 설정

## 10. 백업 및 복구

### 10.1 데이터베이스 백업
Supabase는 자동 백업을 제공하지만, 중요한 데이터는 별도로 백업하는 것을 권장합니다.

### 10.2 코드 백업
GitHub 등의 버전 관리 시스템을 사용하여 코드를 백업하세요.

---

## 추가 도움말

- [Nuxt.js 공식 문서](https://nuxt.com)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Cloudflare Workers 공식 문서](https://developers.cloudflare.com/workers)
- [Nitro Cloudflare 가이드](https://nitro.build/deploy/providers/cloudflare)

문제가 발생하면 각 플랫폼의 공식 문서를 참조하거나 커뮤니티에 도움을 요청하세요.

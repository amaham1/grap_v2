# Cloudflare Workers 배포 가이드

이 프로젝트는 Cloudflare Workers를 사용하여 배포됩니다. 최신 `cloudflare_module` preset을 사용하여 최적화된 성능과 기능을 제공합니다.

## 설정 개요

### Nitro 설정
- **Preset**: `cloudflare_module` (최신 권장 방식)
- **호환성 날짜**: `2024-09-19`
- **Node.js 호환성**: 활성화
- **자동 배포 설정**: 활성화

### 주요 변경사항
1. `cloudflare-pages`에서 `cloudflare_module`로 preset 변경
2. `wrangler.toml` 파일 추가로 Workers 설정 관리
3. 배포 명령어를 Workers 방식으로 변경

## 배포 방법

### 1. 로그인
```bash
npm run login:cloudflare
```

### 2. 로컬 미리보기
```bash
npm run preview:cloudflare
```

### 3. 프로덕션 배포
```bash
npm run deploy:cloudflare
```

## 환경 변수 설정

### 개발 환경
1. `.env.example`을 복사하여 `.env` 파일 생성
2. 로컬 미리보기용으로 `.dev.vars` 파일 생성 (`.env`와 동일한 내용)

### 프로덕션 환경
Cloudflare 대시보드에서 환경 변수 설정:
1. Workers & Pages > 프로젝트 선택
2. Settings > Environment variables
3. 필요한 환경 변수 추가

또는 wrangler CLI 사용:
```bash
npx wrangler secret put SECRET_NAME
```

## 크론 작업 설정

`wrangler.toml`에서 크론 작업 설정 가능:
```toml
[[triggers.crons]]
cron = "0 2 * * *"  # 매일 오전 2시 (주유소 API)

[[triggers.crons]]
cron = "0 9 * * *"  # 매일 오전 9시 (기타 API)
```

## Cloudflare 바인딩

### KV 스토리지
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### D1 데이터베이스
```toml
[[d1_databases]]
binding = "DB"
database_name = "grap-database"
database_id = "your-d1-database-id"
```

### R2 스토리지
```toml
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "grap-assets"
```

## 주의사항

1. **환경 변수 접근**: 요청 생명주기 내에서만 환경 변수에 접근 가능
2. **바인딩 접근**: `event.context.cloudflare.env`를 통해 바인딩에 접근
3. **호환성**: Node.js 호환성이 활성화되어 있어 대부분의 Node.js 모듈 사용 가능
4. **크기 제한**: Workers는 1MB 크기 제한이 있으므로 번들 크기 주의

## 문제 해결

### 빌드 오류
- `npm run build`로 로컬 빌드 테스트
- `wrangler.toml` 설정 확인

### 환경 변수 오류
- `.dev.vars` 파일 확인 (로컬)
- Cloudflare 대시보드에서 환경 변수 확인 (프로덕션)

### 배포 오류
- `npx wrangler login` 재실행
- 프로젝트 권한 확인

## 추가 리소스

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Nitro Cloudflare 가이드](https://nitro.build/deploy/providers/cloudflare)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)

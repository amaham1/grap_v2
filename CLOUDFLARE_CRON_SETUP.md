# Cloudflare Workers Cron Triggers 설정 가이드

이 가이드는 Cloudflare Workers의 Cron Triggers를 사용하여 4개의 API 패치를 자동화하는 방법을 설명합니다.

## 📋 개요

### 설정된 Cron 스케줄
- **주유소 API**: 매일 새벽 2시 KST (17시 UTC 전날) - `0 17 * * *`
- **콘텐츠 API들**: 매일 오전 9시 KST (0시 UTC) - `0 0 * * *`
  - 축제 API (`/api/cron/festivals`)
  - 전시회 API (`/api/cron/exhibitions`)
  - 복지서비스 API (`/api/cron/welfare-services`)

### 변경된 파일들
1. `wrangler.toml` - Cron Triggers 설정 추가
2. `nuxt.config.ts` - Nitro scheduled handler 설정
3. `server/api/scheduled-handler.ts` - 스케줄 이벤트 핸들러
4. `worker-scheduled.js` - Cloudflare Workers 런타임 핸들러
5. 각 cron API 파일들 - Cloudflare Workers 접근 허용

## 🚀 Cloudflare 대시보드 설정 방법

### 1. Cloudflare 대시보드 접속
1. [Cloudflare 대시보드](https://dash.cloudflare.com)에 로그인
2. 계정 선택 후 **Workers & Pages** 메뉴로 이동
3. 해당 Worker 선택

### 2. Cron Triggers 확인 및 설정
1. Worker 상세 페이지에서 **Settings** 탭 클릭
2. **Triggers** 섹션에서 **Cron Triggers** 확인
3. 다음 cron 표현식이 설정되어 있는지 확인:
   - `0 17 * * *` (매일 17시 UTC - 주유소 API)
   - `0 0 * * *` (매일 0시 UTC - 콘텐츠 API들)

### 3. 환경 변수 설정
**Settings** > **Variables** 에서 다음 환경 변수가 설정되어 있는지 확인:
- `SITE_URL`: 배포된 사이트 URL (예: `https://grap.co.kr`)
- 기타 필요한 데이터베이스 및 API 키 환경 변수들

### 4. 배포 및 활성화
1. `wrangler deploy` 명령어로 Worker 배포
2. 배포 완료 후 Cron Triggers가 자동으로 활성화됨
3. **Triggers** 탭에서 Cron Triggers 상태 확인

## 🔧 로컬 테스트 방법

### 1. 개발 서버에서 테스트
```bash
# 개발 서버 실행
npm run dev

# 별도 터미널에서 scheduled 이벤트 테스트
curl "http://localhost:3000/__scheduled" -X POST \
  -H "CF-Scheduled: true" \
  -H "User-Agent: Cloudflare-Workers-Test"
```

### 2. Wrangler를 사용한 테스트
```bash
# Wrangler dev 실행
npx wrangler dev

# 별도 터미널에서 scheduled 이벤트 테스트
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

## 📊 모니터링 및 로그 확인

### 1. Cloudflare 대시보드에서 확인
1. Worker 상세 페이지 > **Settings** > **Trigger Events**
2. **View events** 클릭하여 최근 100개 실행 기록 확인
3. **Metrics** 탭에서 성능 및 오류 통계 확인

### 2. 실시간 로그 확인
```bash
# Wrangler를 사용한 실시간 로그 확인
npx wrangler tail
```

### 3. 데이터베이스 로그 확인
- `api_fetch_logs` 테이블: API 수집 작업 성공/실패 기록
- `system_error_logs` 테이블: 시스템 오류 로그

## 🛠️ 수동 실행 방법

### 1. Cloudflare 대시보드에서
1. Worker 상세 페이지 > **Settings** > **Triggers**
2. **Quick edit** 또는 **Test** 기능 사용

### 2. API 직접 호출
```bash
# 주유소 API 수동 실행
curl -X GET "https://grap.co.kr/api/cron/gas-stations" \
  -H "User-Agent: Cloudflare-Workers-Manual" \
  -H "X-Cron-Source: cloudflare-scheduled" \
  -H "CF-Scheduled: true"

# 축제 API 수동 실행
curl -X GET "https://grap.co.kr/api/cron/festivals" \
  -H "User-Agent: Cloudflare-Workers-Manual" \
  -H "X-Cron-Source: cloudflare-scheduled" \
  -H "CF-Scheduled: true"
```

### 3. 관리자 페이지에서
기존 관리자 페이지 (`/alljeju/admin/trigger-fetch`)에서도 계속 수동 실행 가능

## ⚠️ 주의사항

### 1. 시간대 설정
- Cloudflare Cron Triggers는 UTC 시간 기준으로 동작
- KST는 UTC+9이므로 시간 계산 시 주의

### 2. 보안 설정
- 모든 cron API는 인증된 요청만 허용
- GitHub Actions와 Cloudflare Workers scheduled 이벤트만 접근 가능

### 3. 재시도 로직
- 각 API는 최대 2회 재시도
- 실패 시 5초 대기 후 재시도

### 4. 변경 전파 시간
- Cron Trigger 변경사항은 최대 15분까지 전파 시간 소요
- 즉시 반영되지 않을 수 있음

## 🔄 GitHub Actions에서 Cloudflare Cron으로 마이그레이션

기존 GitHub Actions cron 작업을 비활성화하려면:
1. `.github/workflows/cron-jobs.yml` 파일의 schedule 섹션 주석 처리
2. 또는 파일 전체를 삭제

## 📞 문제 해결

### 1. Cron이 실행되지 않는 경우
- Cloudflare 대시보드에서 Cron Triggers 설정 확인
- Worker 배포 상태 확인
- 환경 변수 설정 확인

### 2. API 호출 실패
- 네트워크 연결 상태 확인
- 외부 API 서버 상태 확인
- 데이터베이스 연결 상태 확인

### 3. 로그 확인 방법
- Cloudflare 대시보드의 실시간 로그
- `wrangler tail` 명령어
- 데이터베이스 로그 테이블

## 📈 성능 최적화

### 1. Green Compute 활성화
Cloudflare 대시보드에서 Green Compute를 활성화하여 재생 에너지로 구동되는 데이터센터에서만 실행

### 2. 모니터링 설정
- 실행 시간 모니터링
- 메모리 사용량 확인
- 오류율 추적

이제 Cloudflare Workers Cron Triggers가 설정되어 매일 자동으로 API 패치가 실행됩니다!

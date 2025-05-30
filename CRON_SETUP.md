# Cron 작업 설정 가이드

이 프로젝트는 GitHub Actions를 사용하여 정기적으로 외부 API에서 데이터를 수집합니다.

## 스케줄

### 주유소 데이터 (gas-stations)
- **실행 시간**: 매일 새벽 2시 (KST)
- **UTC 시간**: 매일 17시 (전날)
- **Cron 표현식**: `0 17 * * *`
- **API 엔드포인트**: `/api/cron/gas-stations`

### 콘텐츠 데이터 (exhibitions, festivals, welfare-services)
- **실행 시간**: 매일 아침 9시 (KST)
- **UTC 시간**: 매일 0시
- **Cron 표현식**: `0 0 * * *`
- **API 엔드포인트들**:
  - `/api/cron/exhibitions-new`
  - `/api/cron/festivals`
  - `/api/cron/welfare-services-new`

## GitHub Actions 설정

### 필요한 환경 변수
GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 환경 변수를 설정해야 합니다:

- `SITE_URL`: 배포된 사이트의 URL (예: `https://your-site.pages.dev`)

### 워크플로우 파일
- 파일 위치: `.github/workflows/cron-jobs.yml`
- 자동 실행: 설정된 스케줄에 따라 자동 실행
- 수동 실행: GitHub Actions 탭에서 "Scheduled Data Fetch" 워크플로우를 수동으로 실행 가능

## 보안

### 접근 제한
모든 cron API 엔드포인트는 다음 조건을 만족하는 요청만 허용합니다:
- User-Agent에 "GitHub-Actions"가 포함되어 있거나
- `X-Cron-Source` 헤더가 `github-actions` 또는 `github-actions-manual`인 경우

### 인증되지 않은 접근
인증되지 않은 접근 시도는 403 Forbidden 오류를 반환합니다.

## 수동 실행

### GitHub Actions를 통한 수동 실행
1. GitHub 저장소의 "Actions" 탭으로 이동
2. "Scheduled Data Fetch" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. 실행할 작업 유형 선택:
   - `all`: 모든 데이터 수집
   - `gas-stations`: 주유소 데이터만
   - `exhibitions`: 전시회 데이터만
   - `festivals`: 축제 데이터만
   - `welfare-services`: 복지서비스 데이터만

### 직접 API 호출 (개발/테스트용)
```bash
# 주유소 데이터 수집
curl -X GET "https://your-site.pages.dev/api/cron/gas-stations" \
  -H "User-Agent: GitHub-Actions-Manual" \
  -H "X-Cron-Source: github-actions-manual"

# 전시회 데이터 수집
curl -X GET "https://your-site.pages.dev/api/cron/exhibitions-new" \
  -H "User-Agent: GitHub-Actions-Manual" \
  -H "X-Cron-Source: github-actions-manual"
```

## 로그 및 모니터링

### 실행 로그 확인
1. GitHub Actions 탭에서 워크플로우 실행 기록 확인
2. 각 작업의 상세 로그 확인 가능
3. 실패한 작업의 오류 메시지 확인

### 데이터베이스 로그
- `api_fetch_logs` 테이블: API 수집 작업의 성공/실패 기록
- `system_error_logs` 테이블: 시스템 오류 로그

## 문제 해결

### 일반적인 문제들

1. **403 Forbidden 오류**
   - 원인: 인증되지 않은 접근
   - 해결: 올바른 헤더와 함께 요청

2. **API 응답 없음**
   - 원인: 외부 API 서버 문제
   - 해결: 재시도 로직이 자동으로 작동 (최대 2회)

3. **데이터베이스 연결 오류**
   - 원인: Supabase 연결 문제
   - 해결: 환경 변수 확인 및 Supabase 상태 점검

### 디버깅

개발 환경에서 cron 작업을 테스트하려면:

```bash
# 로컬 개발 서버 실행
npm run dev

# 별도 터미널에서 API 호출
curl -X GET "http://localhost:3000/api/cron/gas-stations" \
  -H "User-Agent: GitHub-Actions-Manual" \
  -H "X-Cron-Source: github-actions-manual"
```

## 주의사항

1. **시간대**: 모든 스케줄은 UTC 기준으로 설정되어 있습니다.
2. **API 제한**: 외부 API의 요청 제한을 고려하여 적절한 간격으로 실행됩니다.
3. **데이터 중복**: upsert 로직을 사용하여 중복 데이터를 방지합니다.
4. **오류 처리**: 실패한 작업은 자동으로 재시도되며, 로그에 기록됩니다.

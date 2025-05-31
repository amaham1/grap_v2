# 외부 API 엔드포인트 목록

이 문서는 GRAP 프로젝트에서 사용하는 모든 외부 API 엔드포인트를 정리한 것입니다.

## 제주도 공공 API

### 1. 축제/행사 정보 API
- **URL**: `https://www.jeju.go.kr/api/jejutoseoul/festival/`
- **설명**: 제주도 축제 및 행사 정보를 제공하는 API
- **사용 파일**: `server/api/cron/festivals.ts`
- **데이터 수집 주기**: 매일 오전 9시 (Cloudflare Cron)
- **저장 테이블**: `festivals`

### 2. 전시회/공연 정보 API
- **URL**: `http://www.jeju.go.kr/rest/JejuExhibitionService/getJejucultureExhibitionList`
- **설명**: 제주도 전시회 및 공연 정보를 제공하는 API
- **사용 파일**: `server/api/cron/exhibitions.ts`
- **데이터 수집 주기**: 매일 오전 9시 (Cloudflare Cron)
- **저장 테이블**: `exhibitions`

### 3. 복지 서비스 정보 API
- **URL**: `http://www.jeju.go.kr/rest/JejuWelfareServiceInfo/getJejuWelfareServiceInfoList`
- **설명**: 제주도 복지 서비스 정보를 제공하는 API
- **사용 파일**: `server/api/cron/welfare-services.ts`
- **데이터 수집 주기**: 매일 오전 9시 (Cloudflare Cron)
- **저장 테이블**: `welfare_services`

### 4. 주유소 정보 API
- **기본 정보 URL**: `http://api.jejuits.go.kr/api/infoGasInfoList?code=860665`
- **가격 정보 URL**: `http://api.jejuits.go.kr/api/infoGasPriceList?code=860665`
- **설명**: 제주도 주유소 위치 및 가격 정보를 제공하는 API
- **API 키**: `860665`
- **사용 파일**: `server/api/cron/gas-stations.ts`
- **데이터 수집 주기**: 매일 오전 2시 (Cloudflare Cron)
- **저장 테이블**: `gas_stations`

## 외부 서비스 API

### 1. 카카오맵 API
- **JavaScript API**: Kakao Maps JavaScript API
- **설명**: 지도 표시 및 위치 검색 기능
- **사용 위치**: 프론트엔드 지도 컴포넌트
- **API 키**: 환경변수 `KAKAO_MAP_API_KEY`로 관리

### 2. Google AdSense
- **클라이언트 ID**: `ca-pub-6491895061878011`
- **광고 슬롯**: `5895025788`
- **설명**: 웹사이트 광고 수익화
- **사용 위치**: `nuxt.config.ts`에서 스크립트 로드

## 데이터 수집 스케줄

### Cloudflare Cron Jobs
- **주유소 데이터**: 매일 오전 2시
  - 이유: 주유소 가격 정보는 자주 변경되므로 이른 시간에 수집
- **기타 데이터**: 매일 오전 9시
  - 축제/행사 정보
  - 전시회/공연 정보
  - 복지 서비스 정보

### 설정 파일
- **Cloudflare 설정**: `wrangler.toml`
- **환경 변수**: `.env.production`

## API 응답 데이터 처리

### 공통 처리 사항
1. **재시도 로직**: 최대 2회 재시도
2. **에러 로깅**: `logs` 테이블에 수집 결과 기록
3. **데이터 검증**: API 응답 데이터 유효성 검사
4. **HTML 새니타이징**: XSS 방지를 위한 HTML 콘텐츠 정리

### 데이터베이스 저장
- **원본 데이터**: `api_raw_data` 필드에 JSON 형태로 저장
- **가공 데이터**: 각 테이블의 구조화된 필드에 저장
- **관리 정보**: `is_exposed`, `admin_memo` 등 관리자 제어 필드

## 보안 고려사항

### API 접근 제한
- **Cron API**: User-Agent 검증으로 GitHub Actions 또는 관리자만 접근 가능
- **관리자 API**: JWT 토큰 기반 인증
- **공개 API**: 별도 인증 없이 접근 가능 (읽기 전용)

### 환경 변수 관리
- **민감 정보**: `.env.production` 파일로 관리
- **공개 정보**: `nuxt.config.ts`의 `public` 섹션에서 관리

## 문제 해결

### API 연결 실패 시
1. API URL 확인
2. 네트워크 연결 상태 확인
3. API 서버 상태 확인
4. 로그 테이블에서 에러 메시지 확인

### 데이터 수집 실패 시
1. Cloudflare Cron 작업 상태 확인
2. 환경 변수 설정 확인
3. 데이터베이스 연결 상태 확인
4. API 응답 형식 변경 여부 확인

## 업데이트 이력

- **2024-01-XX**: 초기 API 엔드포인트 설정
- **2024-01-XX**: API URL 수정 (올바른 엔드포인트로 변경)
  - 축제 정보: `/festival/` 추가
  - 전시회 정보: REST API 엔드포인트로 변경
  - 복지 서비스: REST API 엔드포인트로 변경

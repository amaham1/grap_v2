# Cloudflare R2 설정 가이드

이 가이드는 GRAP 프로젝트에서 이미지 저장을 위한 Cloudflare R2 설정 방법을 설명합니다.

## 📋 개요

### R2 사용 목적
- **축제 이미지 저장**: 축제 등록/수정 시 업로드되는 이미지 파일
- **썸네일 이미지**: 축제 목록에서 표시되는 대표 이미지
- **고성능 CDN**: 전 세계 빠른 이미지 로딩
- **비용 효율성**: 무료 티어 10GB 제공

## 🚀 Cloudflare R2 설정 방법

### 1. R2 버킷 생성

1. **Cloudflare 대시보드 접속**
   - [Cloudflare 대시보드](https://dash.cloudflare.com) 로그인
   - 계정 선택 후 **R2 Object Storage** 메뉴로 이동

2. **버킷 생성**
   - **Create bucket** 클릭
   - 버킷 이름: `grap-images` (프로덕션용)
   - 버킷 이름: `grap-images-preview` (개발/미리보기용)
   - 지역: **Asia Pacific (APAC)** 선택 (한국과 가까운 지역)

3. **버킷 설정**
   - **Public access**: 활성화 (이미지 공개 접근용)
   - **CORS 설정**: 웹 업로드를 위해 설정 필요

### 2. API 토큰 생성

1. **R2 API 토큰 생성**
   - R2 대시보드에서 **Manage R2 API tokens** 클릭
   - **Create API token** 선택
   - 권한: **Object Read & Write** 선택
   - 버킷: 생성한 버킷들 선택

2. **생성된 정보 저장**
   ```
   Access Key ID: [생성된 키]
   Secret Access Key: [생성된 시크릿]
   Endpoint: https://[account-id].r2.cloudflarestorage.com
   ```

### 3. 커스텀 도메인 설정 (선택사항)

1. **커스텀 도메인 연결**
   - R2 버킷 설정에서 **Custom domains** 클릭
   - 도메인 추가: `images.grap.co.kr` (예시)
   - DNS 레코드 설정 (CNAME)

2. **HTTPS 설정**
   - Cloudflare에서 자동으로 SSL 인증서 제공
   - 이미지 URL: `https://images.grap.co.kr/festivals/1/image.jpg`

## 🔧 환경 변수 설정

### 개발 환경 (.env 또는 .dev.vars)
```env
# Cloudflare R2 설정
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=grap-images-preview
R2_PUBLIC_URL=https://your-account-id.r2.cloudflarestorage.com/grap-images-preview
```

### 프로덕션 환경 (Cloudflare Workers)
```bash
# Wrangler CLI를 사용하여 시크릿 설정
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_ENDPOINT
npx wrangler secret put R2_PUBLIC_URL

# 일반 환경 변수 설정
npx wrangler vars put R2_BUCKET_NAME "grap-images"
```

## 📁 파일 구조 및 명명 규칙

### 디렉토리 구조
```
grap-images/
├── festivals/
│   ├── 1/
│   │   ├── uuid-1.jpg (원본 이미지)
│   │   ├── uuid-2.png
│   │   └── thumbnails/
│   │       ├── uuid-1-thumb.jpg (썸네일)
│   │       └── uuid-2-thumb.png
│   ├── 2/
│   └── ...
├── exhibitions/
└── temp/ (임시 업로드)
```

### 파일 명명 규칙
- **원본 파일**: `{uuid}.{extension}`
- **썸네일**: `{uuid}-thumb.{extension}`
- **경로**: `festivals/{festival_id}/{filename}`

## 🛡️ CORS 설정

R2 버킷에 CORS 설정 추가:

```json
[
  {
    "AllowedOrigins": [
      "https://grap.co.kr",
      "https://localhost:3000",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## 📊 모니터링 및 관리

### 1. 사용량 모니터링
- Cloudflare 대시보드에서 R2 사용량 확인
- 월별 스토리지 및 요청 수 모니터링

### 2. 백업 및 복구
- 중요 이미지는 별도 백업 권장
- R2 버킷 간 복제 설정 가능

### 3. 비용 최적화
- 무료 티어: 10GB 스토리지, 1백만 Class A 작업
- 이미지 압축 및 최적화로 용량 절약
- 불필요한 파일 정기 정리

## 🔍 문제 해결

### 업로드 실패
1. API 토큰 권한 확인
2. CORS 설정 확인
3. 파일 크기 제한 확인 (최대 5TB)

### 이미지 로딩 실패
1. 퍼블릭 액세스 설정 확인
2. 커스텀 도메인 DNS 설정 확인
3. 파일 경로 및 URL 확인

### 권한 오류
1. API 토큰 만료 확인
2. 버킷 권한 설정 확인
3. 환경 변수 설정 확인

## 📚 추가 리소스

- [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)
- [R2 API 참조](https://developers.cloudflare.com/r2/api/)
- [Wrangler CLI 가이드](https://developers.cloudflare.com/workers/wrangler/)

## 💡 필요한 정보 요약

Cloudflare R2 저장공간 설정에 필요한 정보:

1. **Cloudflare 계정**: R2 서비스 활성화
2. **R2 버킷**: `grap-images` (프로덕션), `grap-images-preview` (개발)
3. **API 토큰**: Access Key ID, Secret Access Key
4. **엔드포인트**: `https://[account-id].r2.cloudflarestorage.com`
5. **커스텀 도메인** (선택): `images.grap.co.kr`
6. **CORS 설정**: 웹 업로드 허용
7. **환경 변수**: 개발/프로덕션 환경별 설정

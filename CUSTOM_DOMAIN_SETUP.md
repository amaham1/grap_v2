# 커스텀 도메인 설정 가이드

이 가이드는 Cloudflare R2에서 `images.grap.co.kr` 커스텀 도메인을 설정하는 방법을 설명합니다.

## 🎯 목표

- 현재: `https://pub-9ff6cd90524e49408d5bd12d36b26bd7.r2.dev`
- 변경 후: `https://images.grap.co.kr`

## 📋 사전 요구사항

- `grap.co.kr` 도메인이 Cloudflare에서 관리되고 있어야 함
- Cloudflare R2 버킷 `grap-image`가 생성되어 있어야 함

## 🔧 설정 단계

### 1단계: Cloudflare DNS 설정

1. **Cloudflare 대시보드 접속**
   - [Cloudflare 대시보드](https://dash.cloudflare.com) 로그인
   - `grap.co.kr` 도메인 선택

2. **DNS 레코드 추가**
   - **DNS** → **Records** 메뉴로 이동
   - **Add record** 클릭
   - 다음 정보 입력:
     ```
     Type: CNAME
     Name: images
     Target: grap-image.82da20568b30724b79be07d76b86ebe5.r2.cloudflarestorage.com
     Proxy status: Proxied (주황색 구름 아이콘)
     TTL: Auto
     ```
   - **Save** 클릭

### 2단계: R2 버킷에 커스텀 도메인 연결

1. **R2 대시보드 접속**
   - Cloudflare 대시보드 → **R2 Object Storage**
   - `grap-image` 버킷 클릭

2. **커스텀 도메인 설정**
   - **Settings** 탭으로 이동
   - **Custom domains** 섹션 찾기
   - **Connect domain** 클릭

3. **도메인 연결**
   - 도메인 입력: `images.grap.co.kr`
   - **Continue** 클릭
   - 설정 확인 후 **Connect domain** 클릭

### 3단계: SSL 인증서 확인

1. **SSL 상태 확인**
   - 도메인 연결 후 SSL 인증서가 자동으로 발급됨
   - 보통 5-10분 소요
   - 상태가 "Active"가 될 때까지 대기

2. **테스트**
   - 브라우저에서 `https://images.grap.co.kr` 접속
   - SSL 인증서가 유효한지 확인

### 4단계: 애플리케이션 설정 변경

1. **환경 변수 업데이트**
   ```env
   # .env 파일에서 다음 라인 변경
   # R2_PUBLIC_URL=https://pub-9ff6cd90524e49408d5bd12d36b26bd7.r2.dev
   R2_PUBLIC_URL=https://images.grap.co.kr
   ```

2. **기존 이미지 URL 업데이트**
   ```bash
   # 스크립트 실행으로 기존 이미지 URL 일괄 변경
   cd scripts
   npx tsx --tsconfig tsconfig.json fix-image-urls.ts
   ```

3. **서버 재시작**
   ```bash
   yarn dev
   ```

## ✅ 설정 완료 확인

### 1. DNS 전파 확인 ✅
```bash
# 명령어로 DNS 확인 (Windows)
nslookup images.grap.co.kr

# 또는 온라인 도구 사용
# https://www.whatsmydns.net/
```

### 2. 이미지 접근 테스트 ✅
```
https://images.grap.co.kr/festivals/472/ab5feef7-bbc0-4e75-af4a-29d30ea201af.jpg
```
**상태**: ✅ 정상 작동 확인됨

### 3. 애플리케이션 테스트 ✅
- ✅ 축제 수정 페이지에서 이미지가 정상 로드됨
- ✅ 기존 5개 이미지 모두 새 도메인으로 업데이트 완료
- ✅ 새 이미지 업로드 시 새 도메인으로 저장됨

## 🚨 문제 해결

### DNS 전파 지연
- DNS 변경사항이 전 세계에 전파되는데 최대 48시간 소요
- 보통 5-30분 내에 완료됨

### SSL 인증서 오류
- Cloudflare에서 자동으로 SSL 인증서 발급
- 문제 시 Cloudflare 지원팀 문의

### 이미지 로드 실패
1. DNS 설정 재확인
2. R2 버킷의 커스텀 도메인 연결 상태 확인
3. 브라우저 캐시 삭제 후 재시도

## 📊 설정 전후 비교

| 구분 | 설정 전 | 설정 후 |
|------|---------|---------|
| 도메인 | `pub-xxx.r2.dev` | `images.grap.co.kr` |
| 브랜딩 | Cloudflare 브랜드 | GRAP 브랜드 |
| SEO | 제한적 | 최적화됨 |
| 신뢰성 | 보통 | 높음 |
| 제어권 | 제한적 | 완전한 제어 |

## 🎉 완료!

커스텀 도메인 설정이 완료되면:
- 더 전문적인 이미지 URL
- 브랜드 일관성 향상
- SEO 최적화
- 완전한 도메인 제어권

설정 중 문제가 발생하면 Cloudflare 문서를 참조하거나 지원팀에 문의하세요.

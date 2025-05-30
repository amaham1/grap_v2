# Google AdSense 광고 설정 가이드

이 프로젝트에 Google AdSense 광고가 성공적으로 구현되었습니다.

## 🎯 광고 배치

### 일반 페이지 (복지서비스, 축제, 전시회 등)
- **데스크톱 (1280px 이상)**: 좌우 사이드바에 세로형 광고 (160x600px)
- **모바일/태블릿 (1280px 미만)**: 하단에 반응형 광고

### 주유소 페이지
- **모든 디바이스**: 하단 고정 광고 (100% x 50px)

## 📋 구현된 컴포넌트

### 1. GoogleAdsense.vue
재사용 가능한 애드센스 광고 컴포넌트
- 자동 초기화
- 반응형 지원
- 다양한 광고 포맷 지원

### 2. AdBlock.vue
기존 광고 블록을 GoogleAdsense 컴포넌트로 업데이트
- 데스크톱: 좌우 사이드 광고
- 모바일: 하단 반응형 광고

## 🔧 광고 설정

### AdSense 계정 정보
- **Publisher ID**: `ca-pub-6491895061878011`
- **Ad Slot ID**: `5895025788`
- **상태**: 승인 완료

### 광고 포맷
- **Auto**: 자동 크기 조정 (모바일 최적화)
- **Vertical**: 세로형 광고 (사이드바용)
- **Horizontal**: 가로형 광고 (하단 고정용)

## 📁 파일 구조

```
components/
├── public/
│   ├── GoogleAdsense.vue    # 재사용 가능한 애드센스 컴포넌트
│   └── AdBlock.vue          # 기존 광고 블록 (업데이트됨)

pages/
└── alljeju/
    └── gas-stations/
        └── index.vue        # 주유소 페이지 (하단 광고 추가)

public/
├── ads.txt                  # AdSense 인증 파일
└── robots.txt               # SEO 및 광고 크롤링 설정

nuxt.config.ts               # AdSense 스크립트 전역 로드
```

## 🚀 사용 방법

### 기본 사용법
```vue
<template>
  <GoogleAdsense />
</template>
```

### 커스텀 설정
```vue
<template>
  <GoogleAdsense 
    format="vertical"
    :width="160"
    :height="600"
    full-width-responsive="false"
    container-class="my-custom-class" />
</template>
```

### Props 옵션
- `format`: 광고 포맷 ('auto', 'horizontal', 'vertical', 'rectangle')
- `width`: 광고 너비 (string | number)
- `height`: 광고 높이 (string | number)
- `fullWidthResponsive`: 반응형 여부 ('true' | 'false')
- `containerClass`: 컨테이너 CSS 클래스

## 🔍 SEO 최적화

### robots.txt 설정
- Google AdSense 크롤러 허용
- 관리자 페이지 및 API 차단
- 공개 API 허용

### ads.txt 파일
Google AdSense 인증을 위한 파일이 올바르게 설정되어 있습니다.

## 📊 성능 최적화

### 지연 로딩
- 클라이언트 사이드에서만 초기화
- DOM 렌더링 완료 후 광고 로드
- 타임아웃 설정으로 무한 대기 방지

### 오류 처리
- 스크립트 로드 실패 시 graceful degradation
- 콘솔 경고로 디버깅 지원
- 중복 초기화 방지

## 🛠️ 문제 해결

### 광고가 표시되지 않는 경우
1. **AdSense 승인 상태 확인**
   - Google AdSense 계정에서 승인 상태 확인
   - 정책 위반 여부 점검

2. **브라우저 설정 확인**
   - 광고 차단기 비활성화
   - 개발자 도구에서 네트워크 오류 확인

3. **코드 확인**
   - Publisher ID와 Ad Slot ID 정확성 확인
   - 브라우저 콘솔에서 JavaScript 오류 확인

### 개발 환경에서 테스트
```bash
# 로컬 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000
```

### 배포 후 확인사항
1. ads.txt 파일 접근 가능 여부
2. robots.txt 설정 확인
3. HTTPS 연결 확인
4. 광고 정책 준수 여부

## 📈 모니터링

### Google AdSense 대시보드
- 수익 현황 모니터링
- 광고 성능 분석
- 정책 준수 상태 확인

### 웹사이트 성능
- 페이지 로딩 속도 영향 최소화
- 사용자 경험 저해 방지
- 모바일 친화성 유지

## 🔒 정책 준수

### Google AdSense 정책
- 클릭 유도 금지
- 콘텐츠 품질 유지
- 트래픽 품질 관리

### 개인정보 보호
- 쿠키 정책 준수
- GDPR 규정 준수 (필요시)
- 사용자 동의 관리 (필요시)

## 📞 지원

문제가 발생하거나 추가 설정이 필요한 경우:
1. Google AdSense 고객센터 문의
2. 개발팀 내부 문의
3. 이 문서의 문제 해결 섹션 참조

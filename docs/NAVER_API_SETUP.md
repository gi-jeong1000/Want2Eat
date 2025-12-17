# 네이버 검색 API 설정 가이드

## 개요
네이버 검색 API를 사용하여 블로그 리뷰를 수집하고, 이를 기반으로 할루시네이션 없는 AI 요약을 생성합니다.

## 1. 네이버 개발자 센터 접속
1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. 로그인 (네이버 계정)

## 2. 애플리케이션 등록
1. **내 애플리케이션** 메뉴 클릭
2. **애플리케이션 등록** 버튼 클릭
3. 다음 정보 입력:
   - **애플리케이션 이름**: 하느리의 맛집 지도 (또는 원하는 이름)
   - **사용 API**: 검색 (블로그)
   - **비로그인 오픈 API 서비스 환경**: Web 서비스
   - **서비스 URL**: `http://localhost:3000` (로컬 개발용)
   - **서비스 URL**: `https://your-domain.vercel.app` (프로덕션용)

## 3. API 키 확인
1. 등록한 애플리케이션 클릭
2. **Client ID**와 **Client Secret** 확인

## 4. 환경 변수 설정

### 로컬 개발 (.env.local)
```env
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
```

### Vercel 배포
1. Vercel 프로젝트 설정
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:
   - `NAVER_CLIENT_ID`: 네이버 Client ID
   - `NAVER_CLIENT_SECRET`: 네이버 Client Secret

## 5. API 사용량 확인
- 네이버 개발자 센터에서 일일 사용량 확인 가능
- 무료 티어: 일일 25,000건
- 유료: 건당 요금 (자세한 내용은 네이버 개발자 센터 참조)

## 6. 테스트
환경 변수 설정 후, 장소 상세 페이지에서 AI 요약 재생성 버튼을 클릭하여 테스트합니다.

## 주의사항
- API 키는 절대 공개 저장소에 커밋하지 마세요
- 서비스 URL은 실제 도메인과 일치해야 합니다
- API 사용량을 모니터링하여 한도를 초과하지 않도록 주의하세요

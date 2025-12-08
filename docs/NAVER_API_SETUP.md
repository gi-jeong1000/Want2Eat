# 네이버 API 설정 가이드

## 1. 네이버 클라우드 플랫폼 회원가입

1. [네이버 클라우드 플랫폼](https://www.ncloud.com) 접속
2. "회원가입" 클릭
3. 네이버 계정으로 로그인 또는 새 계정 생성
4. 본인인증 완료

## 2. 지도 API Application 등록

1. 대시보드에서 **AI·NAVER API** 메뉴 클릭
2. **Application 등록** 클릭
3. 설정:
   - **Application 이름**: `Want2Eat Map API` (원하는 이름)
   - **Service 선택**: **Maps** 선택
   - **API 선택**: **Dynamic Map**만 선택하면 됩니다 (Geocoding, Reverse Geocoding 등은 선택하지 않아도 됨)
   - **환경 추가**: 
     - **환경이름**: `Production` (또는 원하는 이름)
     - **서비스 URL**: `https://your-app.vercel.app` (실제 Vercel 도메인, 반드시 https://로 시작)
     - **환경 추가** 버튼 클릭
     - 로컬 개발용으로 `http://localhost:3000`도 추가 가능 (선택사항)
4. "등록" 클릭
5. **Client ID** 복사해두기 (Secret은 필요 없음)

## 3. 검색 API Application 등록

1. **AI·NAVER API** 메뉴에서 다시 **Application 등록** 클릭
2. 설정:
   - **Application 이름**: `Want2Eat Search API` (원하는 이름)
   - **Service 선택**: **Search** 선택
   - **환경 추가**: 
     - **환경이름**: `Web`
     - **서비스 URL**: `http://localhost:3000`
     - 배포 후에는 Vercel URL도 추가
3. "등록" 클릭
4. **Client ID**와 **Client Secret** 복사해두기

## 4. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 추가:

```env
# 네이버 지도 API
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id

# 네이버 검색 API
NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID=your_naver_search_client_id
NEXT_PUBLIC_NAVER_SEARCH_CLIENT_SECRET=your_naver_search_client_secret
```

## 5. API 사용량 확인

- 네이버 클라우드 플랫폼 대시보드에서 **AI·NAVER API** > **Usage** 메뉴에서 사용량 확인 가능
- 무료 할당량:
  - 검색 API: 일일 30,000건
  - 지도 API: 일일 300,000건

## 문제 해결

### "Invalid Client ID" 오류
- `.env.local` 파일의 Client ID가 올바른지 확인
- Application 등록 시 환경 URL이 올바르게 설정되었는지 확인
- 개발 서버 재시작

### CORS 오류
- Application 등록 시 서비스 URL에 현재 도메인이 포함되어 있는지 확인
- 로컬 개발: `http://localhost:3000`
- 배포 후: Vercel URL 추가 필요

### API 호출 제한
- 일일 할당량을 초과했는지 확인
- 네이버 클라우드 플랫폼 대시보드에서 사용량 확인


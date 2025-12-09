# 네이버 API 설정 가이드

## 1. 네이버 클라우드 플랫폼 회원가입

1. [네이버 클라우드 플랫폼](https://www.ncloud.com) 접속
2. "회원가입" 클릭
3. 네이버 계정으로 로그인 또는 새 계정 생성
4. 본인인증 완료

## 2. 지도 API Application 등록

⚠️ **중요**: 네이버 지도 API는 **반드시 서비스 URL을 등록**해야 합니다. 등록하지 않으면 인증 실패 오류가 발생합니다!

> **참고**: 네이버 지도 API는 최신 버전에서 `ncpClientId` → `ncpKeyId`로 파라미터가 변경되었습니다. 이 프로젝트는 최신 API를 사용합니다.

1. 대시보드에서 **AI·NAVER API** 메뉴 클릭
2. **Application 등록** 클릭
3. 설정:
   - **Application 이름**: `Want2Eat Map API` (원하는 이름)
   - **Service 선택**: **Maps** 선택
   - **API 선택**: **Dynamic Map**만 선택하면 됩니다 (Geocoding, Reverse Geocoding 등은 선택하지 않아도 됨)
   - **환경 추가** (반드시 추가해야 함):
     - **환경이름**: `Local Development`
     - **서비스 URL**: `http://localhost:3000` (로컬 개발 시 필수!)
     - **환경 추가** 버튼 클릭
     - 배포 환경용으로 추가 환경 생성:
       - **환경이름**: `Production`
       - **서비스 URL**: `https://your-app.vercel.app` (실제 배포 도메인, 반드시 https://로 시작)
       - **환경 추가** 버튼 클릭
4. "등록" 클릭
5. **Client ID** 복사해두기 (Secret은 필요 없음)

### 기존 Application에 환경 추가하기

이미 Application을 등록했다면:

1. **AI·NAVER API** > **Application** 메뉴에서 등록한 Application 클릭
2. **환경 관리** 또는 **환경 추가** 버튼 클릭
3. 현재 사용 중인 URL 추가:
   - 로컬 개발: `http://localhost:3000` (포트 번호가 다르면 변경)
   - 배포 환경: 실제 배포된 도메인 (예: `https://your-app.vercel.app`)
4. 저장 후 **약 1-2분 정도 대기** (설정 반영 시간 필요)

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

### ⚠️ "인증 실패" 또는 "Invalid Client ID" 오류

**가장 흔한 원인**: 서비스 URL이 등록되지 않았거나 잘못 등록됨

**해결 방법**:

1. **네이버 클라우드 플랫폼 대시보드 확인**:

   - **AI·NAVER API** > **Application** 메뉴로 이동
   - 등록한 지도 API Application 클릭
   - **환경 관리**에서 등록된 서비스 URL 확인

2. **현재 사용 중인 URL 확인**:

   - 로컬 개발: 브라우저 주소창의 URL 확인 (예: `http://localhost:3000`)
   - 배포 환경: 실제 배포된 도메인 확인

3. **서비스 URL 추가/수정**:

   - 로컬 개발: `http://localhost:3000` 반드시 추가 (포트 번호가 다르면 변경)
   - 배포 환경: 실제 배포 도메인 추가 (예: `https://your-app.vercel.app`)
   - **주의**:
     - `http://`와 `https://`는 다릅니다
     - 포트 번호도 정확히 일치해야 합니다
     - URL 끝에 `/`가 있으면 제거하세요

4. **설정 반영 대기**:

   - 서비스 URL 추가/수정 후 **1-2분 정도 대기** (네이버 서버에 반영되는 시간 필요)
   - 브라우저 캐시 삭제 후 다시 시도

5. **환경 변수 확인**:

   - `.env.local` 파일의 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 값이 올바른지 확인
   - Client ID에 공백이나 특수문자가 포함되지 않았는지 확인
   - 개발 서버 재시작 (`npm run dev`)

6. **API 파라미터 확인**:

   - 최신 네이버 지도 API는 `ncpKeyId` 파라미터를 사용합니다 (구버전 `ncpClientId` 아님)
   - 이 프로젝트는 최신 API를 사용하므로 별도 수정 불필요

7. **체크리스트**:
   - [ ] 네이버 클라우드 플랫폼에서 Application이 등록되어 있음
   - [ ] 서비스 URL에 현재 사용 중인 도메인이 정확히 등록되어 있음
   - [ ] `.env.local` 파일에 올바른 Client ID가 설정되어 있음
   - [ ] 개발 서버를 재시작했음
   - [ ] 서비스 URL 추가 후 1-2분 이상 대기했음

### CORS 오류

- Application 등록 시 서비스 URL에 현재 도메인이 포함되어 있는지 확인
- 로컬 개발: `http://localhost:3000`
- 배포 후: Vercel URL 추가 필요

### API 호출 제한

- 일일 할당량을 초과했는지 확인
- 네이버 클라우드 플랫폼 대시보드에서 사용량 확인

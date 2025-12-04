# Want2Eat

연인/친구와 함께 가고 싶은 장소를 저장하고, 방문 기록을 남길 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 🗺️ 지도에서 장소 확인
- 📝 장소 추가 및 관리
- 📸 방문 기록 포스팅 (사진, 글)
- 🔄 장소 상태 관리 (갈 곳, 갔던 곳, 또 가고 싶은 곳)
- 👥 연인/친구와 장소 공유

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: React Query, Zustand
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **External APIs**: 네이버 지도 API, 네이버 검색 API
- **Deployment**: Vercel

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Naver APIs
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID=your_naver_search_client_id
NEXT_PUBLIC_NAVER_SEARCH_CLIENT_SECRET=your_naver_search_client_secret

# 사용자 계정 (선택사항 - 기본값 사용 가능)
USER1_PASSWORD=1009
USER2_PASSWORD=1009
USER1_SUPABASE_ID=your_supabase_user_id_1
USER2_SUPABASE_ID=your_supabase_user_id_2
```

## 로그인 계정

기본 계정 정보:

1. **기정**
   - 아이디: `chun`
   - 비밀번호: `1009` (환경 변수 `USER1_PASSWORD`로 변경 가능)

2. **하늘**
   - 아이디: `haneul`
   - 비밀번호: `1009` (환경 변수 `USER2_PASSWORD`로 변경 가능)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 배포

Vercel에 배포할 때는 환경 변수를 Vercel 대시보드에서 설정하세요.

1. Vercel 프로젝트 설정 > Environment Variables
2. 위의 환경 변수들을 모두 추가
3. 배포

## Supabase 설정

자세한 설정 방법은 [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)를 참고하세요.

## 네이버 API 설정

자세한 설정 방법은 [docs/NAVER_API_SETUP.md](./docs/NAVER_API_SETUP.md)를 참고하세요.

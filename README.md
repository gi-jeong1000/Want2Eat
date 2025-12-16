# 하느리의 맛집 지도

연인/친구와 함께 가고 싶은 장소를 저장하고, 방문 기록을 남길 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 🗺️ 지도에서 장소 검색 및 핀으로 저장 (가볼곳, 갔던곳 구분)
- 📝 저장된 장소를 한눈에 확인
- 📸 장소 상세 정보: 리뷰, 사진, 누가 저장했는지 확인
- 💬 구성원들과 자유롭게 코멘트 작성
- 📸 방문 기록 포스팅 (사진, 글)
- 🔄 장소 상태 관리 (갈 곳, 갔던 곳, 또 가고 싶은 곳)
- 👥 모임(연인) 기반 장소 공유

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: React Query, Zustand
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **External APIs**: 네이버 지도 API, 네이버 검색 API
- **Deployment**: Vercel


## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 초기 설정

1. **Supabase 설정**: `docs/SUPABASE_SETUP.md` 참고
2. **카카오 API 설정**: `docs/KAKAO_API_SETUP.md` 참고
3. **모임 설정**: `docs/GROUP_SETUP.md` 참고 (모임 생성 및 구성원 추가)

## 프로젝트 구조

### 모임 기반 시스템

- **모임(Group)**: 연인/친구 그룹 단위로 장소를 공유
- **자동 공유**: 같은 모임에 속한 구성원들은 모든 장소를 자동으로 공유
- **코멘트**: 모임 구성원들이 장소에 자유롭게 코멘트 작성 가능

### 주요 기능

1. **지도에서 장소 검색 및 저장**: 카카오 지도 API를 사용하여 장소를 검색하고 저장
2. **장소 목록**: 저장된 모든 장소를 한눈에 확인
3. **장소 상세**: 
   - 누가 저장했는지 확인
   - 카카오맵 기반 사진 및 정보
   - 구성원들과 코멘트 작성
   - 방문 기록 포스팅

# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. "Start your project" 또는 "New Project" 클릭
3. GitHub 계정으로 로그인 (또는 이메일로 회원가입)
4. 새 프로젝트 생성:
   - **Name**: `want2eat` (원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (나중에 필요)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 권장)
   - **Pricing Plan**: Free tier 선택
5. "Create new project" 클릭
6. 프로젝트 생성 완료까지 1-2분 대기

## 2. 프로젝트 URL과 API 키 확인

1. 프로젝트 대시보드에서 왼쪽 메뉴의 **Settings** (⚙️) 클릭
2. **API** 섹션으로 이동
3. 다음 정보를 복사해두세요:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

이 값들을 `.env.local` 파일에 설정하세요:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. 데이터베이스 스키마 생성

1. 프로젝트 대시보드에서 왼쪽 메뉴의 **SQL Editor** 클릭
2. "New query" 클릭
3. `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭 (또는 Ctrl+Enter)
5. 성공 메시지 확인

### 스키마 내용 요약:
- `places` 테이블: 장소 정보 저장
- `place_images` 테이블: 장소 사진 정보 저장
- Row Level Security (RLS) 정책: 사용자별 데이터 접근 제어
- 자동 업데이트 트리거: `updated_at` 필드 자동 갱신

## 4. Storage 버킷 생성

1. 왼쪽 메뉴에서 **Storage** 클릭
2. "Create a new bucket" 클릭
3. 설정:
   - **Name**: `place-images`
   - **Public bucket**: ✅ 체크 (공개 버킷으로 설정)
   - **File size limit**: `5MB` (또는 원하는 크기)
   - **Allowed MIME types**: `image/*` (또는 비워두기)
4. "Create bucket" 클릭

### Storage 정책 설정 (선택사항)

더 세밀한 접근 제어가 필요하면:

1. Storage > Policies 메뉴로 이동
2. `place-images` 버킷 선택
3. "New Policy" 클릭
4. 정책 템플릿 선택 또는 직접 작성

## 5. 사용자 계정 생성 (초기 2개 계정)

### 방법 1: Supabase 대시보드에서 생성

1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **Users** 탭 선택
3. "Add user" 또는 "Create user" 클릭
4. 첫 번째 계정 생성:
   - **Email**: `user1@example.com` (원하는 이메일)
   - **Password**: 강력한 비밀번호 설정
   - **Auto Confirm User**: ✅ 체크
5. 두 번째 계정도 동일하게 생성

### 방법 2: 앱에서 직접 회원가입 (나중에)

앱에 회원가입 기능을 추가하면 사용자가 직접 계정을 만들 수 있습니다.

## 6. 환경 변수 설정 확인

프로젝트 루트에 `.env.local` 파일이 있는지 확인하고, 다음 내용이 포함되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ **중요**: `.env.local` 파일은 Git에 커밋하지 마세요! (이미 `.gitignore`에 포함되어 있습니다)

## 7. 테스트

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:3000` 접속
3. 생성한 계정으로 로그인 시도
4. 장소 추가 기능 테스트

## 문제 해결

### "Invalid API key" 오류
- `.env.local` 파일의 API 키가 올바른지 확인
- Supabase 대시보드에서 최신 키 복사
- 개발 서버 재시작 (`npm run dev`)

### "relation does not exist" 오류
- SQL Editor에서 스키마가 제대로 실행되었는지 확인
- `supabase/schema.sql` 파일을 다시 실행

### "permission denied" 오류
- RLS 정책이 제대로 설정되었는지 확인
- Storage 버킷이 Public으로 설정되었는지 확인

### 이미지 업로드 실패
- Storage 버킷이 생성되었는지 확인
- 버킷 이름이 정확히 `place-images`인지 확인
- 버킷이 Public으로 설정되었는지 확인

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트 가이드](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)


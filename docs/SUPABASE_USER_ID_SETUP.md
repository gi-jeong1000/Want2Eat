# Supabase User ID 설정 가이드

장소 저장 기능을 사용하려면 각 사용자 계정에 Supabase User ID(UUID)를 설정해야 합니다.

## ⚠️ 중요: Supabase 사용자 생성 필수!

**장소 저장 기능을 사용하려면 Supabase에 사용자를 먼저 생성해야 합니다!**

현재 로그인 계정(`chun`, `haneul`, `test`) 각각에 대해 Supabase 사용자를 생성해야 합니다.

## 1. Supabase에서 사용자 생성하기 (먼저 해야 할 일)

### 단계별 가이드

1. **[Supabase 대시보드](https://supabase.com/dashboard) 접속**
2. **프로젝트 선택**
3. **Authentication** > **Users** 메뉴 클릭
4. **Add user** 버튼 클릭 (우측 상단 또는 중앙)
5. **사용자 정보 입력:**
   ```
   Email: chun@want2eat.local (또는 원하는 이메일)
   Password: 강력한 비밀번호 입력
   Auto Confirm User: ✅ 반드시 체크!
   ```
6. **Create user** 클릭
7. **생성된 사용자의 UUID 복사** (사용자 목록의 첫 번째 컬럼)

### 여러 사용자 생성

각 로그인 계정마다 Supabase 사용자를 생성하세요:

| 로그인 계정 | Supabase 이메일 예시    | 환경 변수               |
| ----------- | ----------------------- | ----------------------- |
| chun        | `chun@want2eat.local`   | `USER1_SUPABASE_ID`     |
| haneul      | `haneul@want2eat.local` | `USER2_SUPABASE_ID`     |
| test        | `test@want2eat.local`   | `TEST_USER_SUPABASE_ID` |

**팁**:

- 이메일은 실제 이메일이 아니어도 됩니다 (인증용이 아님)
- `@want2eat.local` 같은 형식으로 구분하기 쉽게 만들 수 있습니다
- 각 사용자마다 다른 이메일을 사용하세요

## 2. Supabase에서 User ID 확인하기

### 방법 1: Supabase 대시보드에서 확인

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Authentication** > **Users** 클릭
4. 사용자 목록에서 UUID 복사
   - UUID 형식: `550e8400-e29b-41d4-a716-446655440000`
   - 또는 이메일로 사용자를 찾아서 UUID 확인

### 방법 2: SQL Editor에서 확인

1. Supabase 대시보드 > **SQL Editor** 클릭
2. 다음 쿼리 실행:

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;
```

3. 결과에서 `id` 컬럼의 값이 UUID입니다.

### 방법 3: 새 사용자 생성 (필수!)

**⚠️ Supabase에 사용자가 없으면 반드시 생성해야 합니다!**

#### Supabase 대시보드에서 사용자 생성

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Authentication** > **Users** 클릭
4. **Add user** 버튼 클릭 (또는 상단의 **+ Add user**)
5. 사용자 정보 입력:
   - **Email**: `chun@example.com` (원하는 이메일, 실제 이메일이 아니어도 됨)
   - **Password**: 강력한 비밀번호 입력 (예: `SecurePassword123!`)
   - **Auto Confirm User**: ✅ **반드시 체크** (이메일 확인 없이 바로 사용 가능)
   - **Send invitation email**: ❌ 체크 해제 (선택사항)
6. **Create user** 클릭
7. 생성된 사용자 목록에서 UUID 복사
   - UUID는 사용자 목록의 첫 번째 컬럼에 표시됩니다
   - 형식: `550e8400-e29b-41d4-a716-446655440000`

#### 여러 사용자 생성

각 로그인 계정(`chun`, `haneul`, `test`)마다 Supabase 사용자를 생성해야 합니다:

1. **첫 번째 사용자** (chun 계정용):

   - Email: `chun@example.com` (또는 원하는 이메일)
   - 생성 후 UUID를 `USER1_SUPABASE_ID`에 설정

2. **두 번째 사용자** (haneul 계정용):

   - Email: `haneul@example.com`
   - 생성 후 UUID를 `USER2_SUPABASE_ID`에 설정

3. **세 번째 사용자** (test 계정용):
   - Email: `test@example.com`
   - 생성 후 UUID를 `TEST_USER_SUPABASE_ID`에 설정

**중요**:

- 이메일은 실제 이메일이 아니어도 됩니다 (인증용이 아님)
- 각 로그인 계정마다 별도의 Supabase 사용자가 필요합니다
- UUID는 한 번 생성하면 변경되지 않습니다

## 2. Vercel 환경 변수 설정

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 메뉴
4. 다음 환경 변수 추가:

### 사용자별 환경 변수

각 사용자 계정에 해당하는 Supabase UUID를 설정하세요:

```
USER1_SUPABASE_ID=550e8400-e29b-41d4-a716-446655440000
USER2_SUPABASE_ID=123e4567-e89b-12d3-a456-426614174000
TEST_USER_SUPABASE_ID=987fcdeb-51a2-43d7-8f9e-123456789abc
```

**중요 사항:**

- 변수 이름은 정확히 일치해야 합니다 (대소문자 구분)
- UUID는 하이픈(`-`) 포함 전체를 복사해야 합니다
- 공백이나 따옴표 없이 값만 입력하세요

### 환경별 설정

Vercel에서는 환경별로 변수를 설정할 수 있습니다:

- **Production**: 프로덕션 환경
- **Preview**: 프리뷰/브랜치 환경
- **Development**: 로컬 개발 환경

모든 환경에 동일한 값을 설정하거나, 환경별로 다르게 설정할 수 있습니다.

## 3. 로컬 개발 환경 설정

로컬에서 개발하는 경우 `.env.local` 파일에 추가:

```env
USER1_SUPABASE_ID=550e8400-e29b-41d4-a716-446655440000
USER2_SUPABASE_ID=123e4567-e89b-12d3-a456-426614174000
TEST_USER_SUPABASE_ID=987fcdeb-51a2-43d7-8f9e-123456789abc
```

## 4. 재배포

환경 변수를 추가/수정한 후:

1. **Vercel**: 자동으로 재배포되거나, 수동으로 **Deployments** > **Redeploy** 클릭
2. **로컬**: 개발 서버 재시작 (`npm run dev`)

## 5. 확인 방법

1. 로그인 후 브라우저 콘솔(F12) 확인
2. 에러 메시지가 없으면 정상
3. 장소 저장 기능 테스트

## 문제 해결

### "Supabase user_id가 올바른 UUID 형식이 아닙니다" 오류

**원인:**

- 환경 변수가 설정되지 않음
- UUID 형식이 잘못됨 (하이픈 누락, 공백 포함 등)
- 변수 이름이 잘못됨

**해결:**

1. 환경 변수 이름 확인: `USER1_SUPABASE_ID` (정확히 일치)
2. UUID 형식 확인: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (32자리, 하이픈 포함)
3. Vercel에서 재배포 또는 로컬에서 서버 재시작

### "로그인이 필요합니다" 오류

**원인:**

- 로그인하지 않음
- localStorage에 사용자 정보가 없음

**해결:**

1. 로그아웃 후 다시 로그인
2. 브라우저 개발자 도구 > Application > Local Storage 확인
3. `user` 키에 사용자 정보가 있는지 확인

### UUID를 찾을 수 없음

**해결:**

1. Supabase에서 새 사용자 생성
2. 또는 기존 사용자의 UUID를 SQL Editor에서 확인
3. 환경 변수에 설정 후 재배포

## 참고

- UUID는 Supabase의 `auth.users` 테이블의 `id` 컬럼 값입니다
- 각 사용자 계정마다 고유한 UUID가 있습니다
- UUID는 변경할 수 없으므로 한 번 설정하면 계속 사용할 수 있습니다

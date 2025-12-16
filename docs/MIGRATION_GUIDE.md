# 데이터베이스 마이그레이션 가이드

기존 데이터를 유지하면서 모임 기반 시스템으로 전환하는 방법입니다.

## 주의사항

⚠️ **중요**: 마이그레이션 전에 Supabase에서 데이터베이스 백업을 권장합니다.

## 마이그레이션 단계

### 1단계: Supabase 대시보드 접속

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2단계: 마이그레이션 스크립트 실행

`supabase/migration.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣고 실행합니다.

이 스크립트는:
- ✅ 기존 테이블과 데이터를 유지합니다
- ✅ 새로운 테이블(groups, group_members, place_comments)을 생성합니다
- ✅ places 테이블에 group_id 컬럼을 추가합니다
- ✅ 기존 장소 데이터에 기본 모임 ID를 할당합니다
- ✅ RLS 정책을 업데이트합니다

### 3단계: 사용자 ID 확인

마이그레이션 후 사용자를 모임에 추가해야 합니다. 먼저 Supabase User ID를 확인하세요.

#### 방법 1: Supabase 대시보드에서 확인

1. Supabase 대시보드 → **Authentication** → **Users**
2. 각 사용자의 UUID를 복사

#### 방법 2: SQL로 확인

```sql
-- auth.users 테이블에서 사용자 목록 확인
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at;
```

### 4단계: 모임 구성원 추가

확인한 User ID를 사용하여 모임에 구성원을 추가합니다.

```sql
-- 기정, 하늘을 모임에 추가
-- 아래 USER1_SUPABASE_ID와 USER2_SUPABASE_ID를 실제 값으로 변경하세요
INSERT INTO group_members (group_id, user_id) 
VALUES
  ('00000000-0000-0000-0000-000000000001', 'USER1_SUPABASE_ID'),
  ('00000000-0000-0000-0000-000000000001', 'USER2_SUPABASE_ID')
ON CONFLICT (group_id, user_id) DO NOTHING;
```

**실제 예시:**
```sql
INSERT INTO group_members (group_id, user_id) 
VALUES
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('00000000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901')
ON CONFLICT (group_id, user_id) DO NOTHING;
```

### 5단계: 환경 변수 설정

`.env.local` 파일에 모임 ID를 추가합니다:

```env
NEXT_PUBLIC_GROUP_ID=00000000-0000-0000-0000-000000000001
```

Vercel에 배포하는 경우 Vercel 환경 변수에도 추가하세요.

### 6단계: 확인

마이그레이션이 성공적으로 완료되었는지 확인합니다:

```sql
-- 모임 확인
SELECT * FROM groups;

-- 모임 구성원 확인
SELECT 
  gm.id,
  g.name as group_name,
  gm.user_id,
  u.email
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
LEFT JOIN auth.users u ON u.id = gm.user_id;

-- 장소에 모임이 할당되었는지 확인
SELECT 
  id,
  name,
  group_id,
  user_id
FROM places
LIMIT 10;
```

## 문제 해결

### 에러: "column group_id does not exist"

마이그레이션 스크립트가 완전히 실행되지 않았을 수 있습니다. `supabase/migration.sql`의 4번 단계를 다시 실행하세요.

### 에러: "violates not-null constraint"

기존 장소에 group_id가 할당되지 않았을 수 있습니다. 다음 SQL을 실행하세요:

```sql
UPDATE places 
SET group_id = '00000000-0000-0000-0000-000000000001'
WHERE group_id IS NULL;
```

### 기존 장소를 볼 수 없음

모임 구성원이 제대로 추가되지 않았을 수 있습니다. 4단계를 다시 확인하세요.

## 롤백 방법

문제가 발생하면 다음 순서로 롤백할 수 있습니다:

```sql
-- 1. 새로 추가된 컬럼 제거 (주의: 데이터 손실 가능)
ALTER TABLE places DROP COLUMN IF EXISTS group_id;

-- 2. 새로 생성된 테이블 삭제
DROP TABLE IF EXISTS place_comments CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- 3. 기존 RLS 정책 복원 (필요한 경우)
-- 원래 정책으로 수동 복원
```

## 완료 후

마이그레이션이 완료되면:
1. ✅ 모든 기존 장소가 기본 모임에 할당됩니다
2. ✅ 모임 구성원들이 모든 장소를 볼 수 있습니다
3. ✅ 코멘트 기능을 사용할 수 있습니다
4. ✅ 새로운 장소는 자동으로 모임에 연결됩니다


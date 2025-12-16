-- 기존 데이터를 유지하면서 모임 기반 시스템으로 마이그레이션
-- 이 스크립트는 기존 데이터를 보존하면서 새로운 구조로 전환합니다.

-- 1. groups 테이블 생성 (이미 존재하면 스킵)
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. group_members 테이블 생성 (이미 존재하면 스킵)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. place_comments 테이블 생성 (이미 존재하면 스킵)
CREATE TABLE IF NOT EXISTS place_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. places 테이블에 group_id 컬럼 추가 (기존 데이터 유지)
-- 컬럼이 이미 존재하면 에러가 발생하므로 조건부로 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE places ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. 기본 모임 생성 (이미 존재하면 스킵)
-- 모임 ID는 고정값 사용 (환경 변수와 일치해야 함)
INSERT INTO groups (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', '연인') 
ON CONFLICT (id) DO NOTHING;

-- 6. 기존 places 데이터에 기본 모임 ID 할당
-- group_id가 NULL인 기존 장소들에 기본 모임 ID를 할당
UPDATE places 
SET group_id = '00000000-0000-0000-0000-000000000001'
WHERE group_id IS NULL;

-- 7. group_id를 NOT NULL로 변경 (기본값 할당 후)
-- 먼저 모든 NULL 값을 처리한 후에 NOT NULL 제약 추가
DO $$ 
BEGIN
  -- 모든 NULL 값에 기본 모임 ID 할당
  UPDATE places 
  SET group_id = '00000000-0000-0000-0000-000000000001'
  WHERE group_id IS NULL;
  
  -- 이제 NOT NULL 제약 추가
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' 
    AND column_name = 'group_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE places ALTER COLUMN group_id SET NOT NULL;
  END IF;
END $$;

-- 8. 기존 사용자들을 기본 모임에 추가
-- 주의: USER1_SUPABASE_ID와 USER2_SUPABASE_ID를 실제 Supabase User ID로 변경해야 합니다
-- 이 부분은 환경 변수에서 가져온 값으로 수동으로 실행하거나
-- 별도의 스크립트로 실행해야 합니다.

-- 예시 (실제 User ID로 변경 필요):
-- INSERT INTO group_members (group_id, user_id) 
-- VALUES
--   ('00000000-0000-0000-0000-000000000001', 'USER1_SUPABASE_ID'),
--   ('00000000-0000-0000-0000-000000000001', 'USER2_SUPABASE_ID')
-- ON CONFLICT (group_id, user_id) DO NOTHING;

-- 9. 기존 RLS 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view all places" ON places;
DROP POLICY IF EXISTS "Users can view shared places" ON places;
DROP POLICY IF EXISTS "Users can insert their own places" ON places;
DROP POLICY IF EXISTS "Users can update their own places" ON places;
DROP POLICY IF EXISTS "Users can update shared places" ON places;
DROP POLICY IF EXISTS "Users can delete their own places" ON places;

-- 10. 새로운 RLS 정책 생성
-- groups 테이블 정책
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- group_members 테이블 정책
DROP POLICY IF EXISTS "Users can view their group members" ON group_members;
CREATE POLICY "Users can view their group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- places 테이블 정책
CREATE POLICY "Users can view group places" ON places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = places.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own places" ON places
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = places.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update group places" ON places
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = places.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own places" ON places
  FOR DELETE USING (auth.uid() = user_id);

-- 11. place_images, place_posts, place_post_images 정책 업데이트
-- place_images
DROP POLICY IF EXISTS "Users can view all images" ON place_images;
DROP POLICY IF EXISTS "Users can view group images" ON place_images;
CREATE POLICY "Users can view group images" ON place_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_images.place_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert images for their places" ON place_images;
DROP POLICY IF EXISTS "Users can insert images for group places" ON place_images;
CREATE POLICY "Users can insert images for group places" ON place_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_images.place_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete images for their places" ON place_images;
DROP POLICY IF EXISTS "Users can delete images for group places" ON place_images;
CREATE POLICY "Users can delete images for group places" ON place_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_images.place_id
      AND group_members.user_id = auth.uid()
    )
  );

-- place_posts
DROP POLICY IF EXISTS "Users can view posts" ON place_posts;
DROP POLICY IF EXISTS "Users can view group posts" ON place_posts;
CREATE POLICY "Users can view group posts" ON place_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_posts.place_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert posts" ON place_posts;
CREATE POLICY "Users can insert posts" ON place_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_posts.place_id
      AND group_members.user_id = auth.uid()
    )
  );

-- place_post_images
DROP POLICY IF EXISTS "Users can view post images" ON place_post_images;
DROP POLICY IF EXISTS "Users can view group post images" ON place_post_images;
CREATE POLICY "Users can view group post images" ON place_post_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM place_posts
      JOIN places ON places.id = place_posts.place_id
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE place_posts.id = place_post_images.post_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 12. place_comments 테이블 RLS 정책
ALTER TABLE place_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view group comments" ON place_comments;
CREATE POLICY "Users can view group comments" ON place_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_comments.place_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert comments" ON place_comments;
CREATE POLICY "Users can insert comments" ON place_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_comments.place_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their comments" ON place_comments;
CREATE POLICY "Users can update their comments" ON place_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their comments" ON place_comments;
CREATE POLICY "Users can delete their comments" ON place_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 13. updated_at 트리거 추가 (place_comments)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_place_comments_updated_at ON place_comments;
CREATE TRIGGER update_place_comments_updated_at BEFORE UPDATE ON place_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. groups 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
DO $$ 
BEGIN
  RAISE NOTICE '마이그레이션이 완료되었습니다!';
  RAISE NOTICE '다음 단계: group_members 테이블에 사용자를 추가하세요.';
  RAISE NOTICE '예시: INSERT INTO group_members (group_id, user_id) VALUES (''00000000-0000-0000-0000-000000000001'', ''YOUR_USER_ID'');';
END $$;


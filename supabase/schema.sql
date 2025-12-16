-- groups 테이블 생성 (모임)
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- group_members 테이블 생성 (모임 구성원)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- places 테이블 생성
CREATE TABLE IF NOT EXISTS places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  naver_place_id TEXT,
  rating FLOAT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'want_to_go' CHECK (status IN ('want_to_go', 'visited', 'want_to_visit_again')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- place_images 테이블 생성 (장소 기본 이미지)
CREATE TABLE IF NOT EXISTS place_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- place_posts 테이블 생성 (블로그 포스팅)
CREATE TABLE IF NOT EXISTS place_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- place_post_images 테이블 생성 (포스팅 이미지)
CREATE TABLE IF NOT EXISTS place_post_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES place_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- place_comments 테이블 생성 (장소 코멘트)
CREATE TABLE IF NOT EXISTS place_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_comments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view their group members" ON group_members;
DROP POLICY IF EXISTS "Users can view group places" ON places;
DROP POLICY IF EXISTS "Users can insert their own places" ON places;
DROP POLICY IF EXISTS "Users can update group places" ON places;
DROP POLICY IF EXISTS "Users can delete their own places" ON places;
DROP POLICY IF EXISTS "Users can view group images" ON place_images;
DROP POLICY IF EXISTS "Users can insert images for group places" ON place_images;
DROP POLICY IF EXISTS "Users can delete images for group places" ON place_images;
DROP POLICY IF EXISTS "Users can view group posts" ON place_posts;
DROP POLICY IF EXISTS "Users can insert posts" ON place_posts;
DROP POLICY IF EXISTS "Users can update their posts" ON place_posts;
DROP POLICY IF EXISTS "Users can delete their posts" ON place_posts;
DROP POLICY IF EXISTS "Users can view group post images" ON place_post_images;
DROP POLICY IF EXISTS "Users can insert post images" ON place_post_images;
DROP POLICY IF EXISTS "Users can delete post images" ON place_post_images;
DROP POLICY IF EXISTS "Users can view group comments" ON place_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON place_comments;
DROP POLICY IF EXISTS "Users can update their comments" ON place_comments;
DROP POLICY IF EXISTS "Users can delete their comments" ON place_comments;

-- groups 테이블 정책
-- 자신이 속한 모임 조회
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- group_members 테이블 정책
-- 자신이 속한 모임의 구성원 조회
CREATE POLICY "Users can view their group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- places 테이블 정책
-- 같은 모임에 속한 사용자들의 장소 조회
CREATE POLICY "Users can view group places" ON places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = places.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 자신이 속한 모임에 장소 생성
CREATE POLICY "Users can insert their own places" ON places
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = places.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 같은 모임에 속한 사용자들의 장소 수정
CREATE POLICY "Users can update group places" ON places
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = places.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 자신의 장소만 삭제
CREATE POLICY "Users can delete their own places" ON places
  FOR DELETE USING (auth.uid() = user_id);

-- place_images 테이블 정책
CREATE POLICY "Users can view group images" ON place_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_images.place_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images for group places" ON place_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_images.place_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images for group places" ON place_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_images.place_id
      AND group_members.user_id = auth.uid()
    )
  );

-- place_posts 테이블 정책
CREATE POLICY "Users can view group posts" ON place_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_posts.place_id
      AND group_members.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can update their posts" ON place_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their posts" ON place_posts
  FOR DELETE USING (auth.uid() = user_id);

-- place_post_images 테이블 정책
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

CREATE POLICY "Users can insert post images" ON place_post_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM place_posts
      WHERE place_posts.id = place_post_images.post_id
      AND place_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete post images" ON place_post_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM place_posts
      WHERE place_posts.id = place_post_images.post_id
      AND place_posts.user_id = auth.uid()
    )
  );

-- place_comments 테이블 정책
CREATE POLICY "Users can view group comments" ON place_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      JOIN group_members ON group_members.group_id = places.group_id
      WHERE places.id = place_comments.place_id
      AND group_members.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can update their comments" ON place_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON place_comments
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_place_posts_updated_at BEFORE UPDATE ON place_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_place_comments_updated_at BEFORE UPDATE ON place_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초기 모임 생성 (기정, 하늘 포함)
-- 주의: 이 부분은 Supabase 대시보드에서 직접 실행하거나, 환경 변수로 user_id를 받아서 실행해야 합니다.
-- INSERT INTO groups (id, name) VALUES 
--   ('00000000-0000-0000-0000-000000000001', '연인') 
--   ON CONFLICT DO NOTHING;
--
-- INSERT INTO group_members (group_id, user_id) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'USER1_SUPABASE_ID'),
--   ('00000000-0000-0000-0000-000000000001', 'USER2_SUPABASE_ID')
--   ON CONFLICT DO NOTHING;


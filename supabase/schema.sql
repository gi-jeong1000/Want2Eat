-- places 테이블 생성
CREATE TABLE IF NOT EXISTS places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- place_shares 테이블 생성 (장소 공유)
CREATE TABLE IF NOT EXISTS place_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(place_id, shared_with)
);

-- RLS 정책 설정
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_shares ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view all places" ON places;
DROP POLICY IF EXISTS "Users can view shared places" ON places;
DROP POLICY IF EXISTS "Users can insert their own places" ON places;
DROP POLICY IF EXISTS "Users can update their own places" ON places;
DROP POLICY IF EXISTS "Users can update shared places" ON places;
DROP POLICY IF EXISTS "Users can delete their own places" ON places;
DROP POLICY IF EXISTS "Users can view all images" ON place_images;
DROP POLICY IF EXISTS "Users can insert images for their places" ON place_images;
DROP POLICY IF EXISTS "Users can delete images for their places" ON place_images;
DROP POLICY IF EXISTS "Users can view posts" ON place_posts;
DROP POLICY IF EXISTS "Users can insert posts" ON place_posts;
DROP POLICY IF EXISTS "Users can update their posts" ON place_posts;
DROP POLICY IF EXISTS "Users can delete their posts" ON place_posts;
DROP POLICY IF EXISTS "Users can view post images" ON place_post_images;
DROP POLICY IF EXISTS "Users can insert post images" ON place_post_images;
DROP POLICY IF EXISTS "Users can delete post images" ON place_post_images;
DROP POLICY IF EXISTS "Users can view shares" ON place_shares;
DROP POLICY IF EXISTS "Users can create shares" ON place_shares;
DROP POLICY IF EXISTS "Users can delete shares" ON place_shares;

-- places 테이블 정책
-- 자신의 장소 또는 공유받은 장소 조회
CREATE POLICY "Users can view all places" ON places
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM place_shares
      WHERE place_shares.place_id = places.id
      AND place_shares.shared_with = auth.uid()
    )
  );

-- 자신의 장소만 생성
CREATE POLICY "Users can insert their own places" ON places
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 자신의 장소 또는 공유받은 장소 수정
CREATE POLICY "Users can update their own places" ON places
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM place_shares
      WHERE place_shares.place_id = places.id
      AND place_shares.shared_with = auth.uid()
    )
  );

-- 자신의 장소만 삭제
CREATE POLICY "Users can delete their own places" ON places
  FOR DELETE USING (auth.uid() = user_id);

-- place_images 테이블 정책
CREATE POLICY "Users can view all images" ON place_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_images.place_id
      AND (
        places.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM place_shares
          WHERE place_shares.place_id = places.id
          AND place_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert images for their places" ON place_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_images.place_id
      AND (
        places.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM place_shares
          WHERE place_shares.place_id = places.id
          AND place_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete images for their places" ON place_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_images.place_id
      AND (
        places.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM place_shares
          WHERE place_shares.place_id = places.id
          AND place_shares.shared_with = auth.uid()
        )
      )
    )
  );

-- place_posts 테이블 정책
CREATE POLICY "Users can view posts" ON place_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_posts.place_id
      AND (
        places.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM place_shares
          WHERE place_shares.place_id = places.id
          AND place_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert posts" ON place_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_posts.place_id
      AND (
        places.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM place_shares
          WHERE place_shares.place_id = places.id
          AND place_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their posts" ON place_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their posts" ON place_posts
  FOR DELETE USING (auth.uid() = user_id);

-- place_post_images 테이블 정책
CREATE POLICY "Users can view post images" ON place_post_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM place_posts
      WHERE place_posts.id = place_post_images.post_id
      AND (
        place_posts.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM places
          JOIN place_shares ON place_shares.place_id = places.id
          WHERE places.id = place_posts.place_id
          AND place_shares.shared_with = auth.uid()
        )
      )
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

-- place_shares 테이블 정책
CREATE POLICY "Users can view shares" ON place_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR shared_with = auth.uid()
  );

CREATE POLICY "Users can create shares" ON place_shares
  FOR INSERT WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_shares.place_id
      AND places.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares" ON place_shares
  FOR DELETE USING (
    shared_by = auth.uid() OR shared_with = auth.uid()
  );

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


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: placeId } = await params;

    // 쿠키에서 user_id 가져오기
    const cookieHeader = request.headers.get("cookie");
    const userId = getSupabaseUserIdFromCookie(cookieHeader);

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 서비스 역할 키로 클라이언트 생성 (RLS 우회)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
      return NextResponse.json(
        { error: "Supabase URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase Service Role Key가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 장소 조회 (모든 장소 조회 가능)
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("*")
      .eq("id", placeId)
      .single();

    if (placeError) {
      console.error("장소 조회 오류:", placeError);
      return NextResponse.json(
        { error: placeError.message || "장소를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!place) {
      return NextResponse.json(
        { error: "장소를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미지 조회
    const { data: images, error: imagesError } = await supabase
      .from("place_images")
      .select("*")
      .eq("place_id", placeId);

    if (imagesError) {
      console.error("이미지 조회 오류:", imagesError);
    }

    // 포스팅 조회
    const { data: posts, error: postsError } = await supabase
      .from("place_posts")
      .select("*")
      .eq("place_id", placeId)
      .order("visited_at", { ascending: false });

    if (postsError) {
      console.error("포스팅 조회 오류:", postsError);
    }

    // 포스팅 이미지 가져오기
    let postsWithImages: any[] = [];
    if (posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: postImages } = await supabase
        .from("place_post_images")
        .select("*")
        .in("post_id", postIds);

      const postImagesData = (postImages || []) as any[];
      postsWithImages = posts.map((post) => ({
        ...post,
        images: postImagesData.filter((img) => img.post_id === post.id) || [],
      }));
    }

    // 코멘트 조회
    const { data: comments, error: commentsError } = await supabase
      .from("place_comments")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("코멘트 조회 오류:", commentsError);
    }

    return NextResponse.json({
      ...place,
      images: images || [],
      posts: postsWithImages,
      comments: comments || [],
    });
  } catch (error: any) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


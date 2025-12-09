import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";

export async function GET(request: NextRequest) {
  try {
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

    // 자신의 장소 조회
    const { data: placesData, error: placesError } = await supabase
      .from("places")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (placesError) {
      console.error("장소 조회 오류:", placesError);
      return NextResponse.json(
        { error: placesError.message || "장소 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 이미지 조회
    const placeIds = (placesData || []).map((p) => p.id);
    let imagesData: any[] = [];
    if (placeIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from("place_images")
        .select("*")
        .in("place_id", placeIds);

      if (imagesError) {
        console.error("이미지 조회 오류:", imagesError);
      } else {
        imagesData = images || [];
      }
    }

    // 포스팅 조회
    let postsData: any[] = [];
    if (placeIds.length > 0) {
      const { data: posts, error: postsError } = await supabase
        .from("place_posts")
        .select("*")
        .in("place_id", placeIds);

      if (postsError) {
        console.error("포스팅 조회 오류:", postsError);
      } else {
        postsData = posts || [];
      }
    }

    // 데이터 결합
    const placesWithImages = (placesData || []).map((place) => ({
      ...place,
      images: imagesData.filter((img) => img.place_id === place.id),
      posts:
        postsData
          ?.filter((post) => post.place_id === place.id)
          .map((post) => ({
            ...post,
            images: [],
          })) || [],
    }));

    return NextResponse.json(placesWithImages);
  } catch (error: any) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

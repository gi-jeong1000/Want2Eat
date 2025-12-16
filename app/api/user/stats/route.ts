import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const supabaseUserId = getSupabaseUserIdFromCookie(cookieHeader);

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type !== "places" && type !== "posts") {
      return NextResponse.json(
        { error: "잘못된 타입입니다." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || supabaseUrl.includes("placeholder") || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let count = 0;

    if (type === "places") {
      const { count: placesCount } = await supabase
        .from("places")
        .select("*", { count: "exact", head: true })
        .eq("user_id", supabaseUserId);

      count = placesCount || 0;
    } else if (type === "posts") {
      const { count: postsCount } = await supabase
        .from("place_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", supabaseUserId);

      count = postsCount || 0;
    }

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("사용자 통계 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


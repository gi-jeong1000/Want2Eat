import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 쿠키에서 user_id 가져오기
    const cookieHeader = request.headers.get("cookie");
    const userId = getSupabaseUserIdFromCookie(cookieHeader);

    if (!userId) {
      return NextResponse.json(
        { 
          error: "로그인이 필요합니다.",
          details: "Supabase User ID가 설정되지 않았습니다. 환경 변수를 확인하세요."
        },
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
        { 
          error: "Supabase Service Role Key가 설정되지 않았습니다.",
          details: "Vercel 환경 변수에 SUPABASE_SERVICE_ROLE_KEY를 설정하세요."
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 장소 생성
    const { data, error } = await supabase
      .from("places")
      .insert({
        user_id: userId,
        name: body.name,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        naver_place_id: body.naver_place_id,
        rating: body.rating,
        comment: body.comment,
        status: body.status,
      })
      .select()
      .single();

    if (error) {
      console.error("장소 생성 오류:", error);
      return NextResponse.json(
        { 
          error: error.message || "장소 저장에 실패했습니다.",
          details: error.details || error.hint || ""
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


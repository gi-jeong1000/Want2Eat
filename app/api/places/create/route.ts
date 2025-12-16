import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";
import { getGroupId } from "@/lib/get-group-id";
import { generatePlaceSummary } from "@/lib/gemini/client";

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

    // 모임 ID 가져오기
    const groupId = getGroupId();
    if (!groupId) {
      return NextResponse.json(
        { 
          error: "모임 ID가 설정되지 않았습니다.",
          details: "환경 변수에 NEXT_PUBLIC_GROUP_ID를 설정하세요."
        },
        { status: 500 }
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

    // Gemini API로 장소 요약 생성 (비동기, 실패해도 계속 진행)
    let aiSummary = "";
    try {
      aiSummary = await generatePlaceSummary(
        body.name,
        body.address,
        body.category_name
      );
    } catch (error) {
      console.error("AI 요약 생성 실패:", error);
      // AI 요약 실패해도 장소 저장은 계속 진행
    }

    // 장소 생성
    const { data, error } = await supabase
      .from("places")
      .insert({
        user_id: userId,
        group_id: groupId,
        name: body.name,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        naver_place_id: body.naver_place_id,
        rating: body.rating,
        comment: body.comment,
        status: body.status,
        ai_summary: aiSummary || null,
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


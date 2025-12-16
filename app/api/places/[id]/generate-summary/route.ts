import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";
import { generatePlaceSummary } from "@/lib/gemini/client";

/**
 * 장소 AI 요약 생성 API
 * 장소 저장과 별개로 비동기로 처리됩니다.
 */
export async function POST(
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

    // 장소 정보 조회
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("name, address")
      .eq("id", placeId)
      .single();

    if (placeError || !place) {
      console.error("장소 조회 오류:", placeError);
      return NextResponse.json(
        { error: "장소를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Gemini API로 요약 생성
    const aiSummary = await generatePlaceSummary(
      place.name,
      place.address
    );

    if (!aiSummary) {
      return NextResponse.json(
        { error: "AI 요약 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 데이터베이스에 요약 업데이트
    const { error: updateError } = await supabase
      .from("places")
      .update({ ai_summary: aiSummary })
      .eq("id", placeId);

    if (updateError) {
      console.error("요약 업데이트 오류:", updateError);
      return NextResponse.json(
        { error: "요약 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ai_summary: aiSummary,
    });
  } catch (error: any) {
    console.error("AI 요약 생성 서버 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


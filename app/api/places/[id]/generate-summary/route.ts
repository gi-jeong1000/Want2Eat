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
      .select("name, address, naver_place_id")
      .eq("id", placeId)
      .single();

    if (placeError || !place) {
      console.error("장소 조회 오류:", placeError);
      return NextResponse.json(
        { error: "장소를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 카테고리 정보 가져오기 (카카오 맵에서)
    let category: string | undefined = undefined;
    if (place.naver_place_id) {
      try {
        // 장소 이름으로 카카오 맵에서 카테고리 정보 가져오기
        const kakaoResponse = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(place.name)}&size=1`,
          {
            headers: {
              Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
            },
          }
        );
        if (kakaoResponse.ok) {
          const kakaoData = await kakaoResponse.json();
          if (kakaoData.documents && kakaoData.documents.length > 0) {
            category = kakaoData.documents[0].category_name;
          }
        }
      } catch (err) {
        console.warn("카테고리 정보 조회 실패:", err);
        // 카테고리 정보가 없어도 계속 진행
      }
    }

    // Gemini API 키 확인
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { 
          success: false,
          error: "AI 요약을 생성할 수 없습니다. GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.",
          details: "서버 환경 변수에 GEMINI_API_KEY를 설정해주세요."
        },
        { status: 200 }
      );
    }

    // Gemini API로 요약 생성
    let aiSummary = "";
    try {
      console.log("Gemini API 호출 시작:", {
        placeName: place.name,
        address: place.address,
        category: category || "없음",
        apiKeyExists: !!geminiApiKey,
      });
      
      aiSummary = await generatePlaceSummary(
        place.name,
        place.address,
        category
      );
      
      console.log("Gemini API 응답:", {
        hasSummary: !!aiSummary,
        summaryLength: aiSummary?.length || 0,
      });
    } catch (error) {
      console.error("Gemini API 호출 오류:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        { 
          success: false,
          error: "AI 요약 생성 중 오류가 발생했습니다.",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 200 }
      );
    }

    // 요약이 비어있으면 실패로 처리
    if (!aiSummary) {
      console.warn("AI 요약이 생성되지 않았습니다.", {
        placeName: place.name,
        apiKeyExists: !!geminiApiKey,
        possibleReasons: [
          "API 키가 유효하지 않음",
          "일일/분당 요청 한도 초과",
          "Gemini API 서버 오류",
          "잘못된 요청 형식"
        ]
      });
      return NextResponse.json(
        { 
          success: false,
          error: "AI 요약을 생성할 수 없습니다. API 키를 확인하거나 잠시 후 다시 시도해주세요.",
          details: "서버 콘솔 로그를 확인하여 상세한 오류 정보를 확인하세요."
        },
        { status: 200 }
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


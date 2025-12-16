import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";

// 코멘트 조회
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

    // 코멘트 조회
    const { data: comments, error: commentsError } = await supabase
      .from("place_comments")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("코멘트 조회 오류:", commentsError);
      return NextResponse.json(
        { error: commentsError.message || "코멘트 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(comments || []);
  } catch (error: any) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 코멘트 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: placeId } = await params;
    const body = await request.json();

    // 쿠키에서 user_id 가져오기
    const cookieHeader = request.headers.get("cookie");
    const userId = getSupabaseUserIdFromCookie(cookieHeader);

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: "코멘트 내용을 입력해주세요." },
        { status: 400 }
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

    // 코멘트 생성
    const { data, error } = await supabase
      .from("place_comments")
      .insert({
        place_id: placeId,
        user_id: userId,
        content: body.content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("코멘트 생성 오류:", error);
      return NextResponse.json(
        { error: error.message || "코멘트 작성에 실패했습니다." },
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


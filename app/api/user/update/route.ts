import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserIdFromCookie } from "@/lib/get-user-id";
import { getUserById } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const supabaseUserId = getSupabaseUserIdFromCookie(cookieHeader);

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (name.trim().length > 20) {
      return NextResponse.json(
        { error: "이름은 20자 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 현재는 환경 변수 기반이므로 실제로는 localStorage만 업데이트
    // 나중에 데이터베이스에 사용자 정보를 저장하면 여기서 업데이트
    // 지금은 클라이언트에서만 처리하므로 성공 응답만 반환

    return NextResponse.json({
      success: true,
      name: name.trim(),
      message: "이름이 변경되었습니다.",
    });
  } catch (error: any) {
    console.error("사용자 정보 업데이트 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


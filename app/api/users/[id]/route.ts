import { NextRequest, NextResponse } from "next/server";
import { getUserNameBySupabaseId } from "@/lib/get-user-name";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const userName = getUserNameBySupabaseId(userId);

    return NextResponse.json({
      id: userId,
      name: userName || "알 수 없음",
    });
  } catch (error: any) {
    console.error("사용자 이름 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


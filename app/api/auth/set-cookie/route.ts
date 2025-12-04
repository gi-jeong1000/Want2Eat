import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { user }: { user: User } = await request.json();

    if (!user) {
      return NextResponse.json({ error: "사용자 정보가 없습니다." }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // 쿠키 설정 (httpOnly 제거하여 클라이언트에서도 접근 가능하도록)
    response.cookies.set("isAuthenticated", "true", {
      httpOnly: false, // 클라이언트에서도 접근 가능
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    response.cookies.set("user", JSON.stringify(user), {
      httpOnly: false, // 클라이언트에서도 접근 가능
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("쿠키 설정 오류:", error);
    return NextResponse.json({ error: "쿠키 설정 실패" }, { status: 500 });
  }
}

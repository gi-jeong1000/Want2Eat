import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/auth";

// 서버 사이드에서만 환경 변수 접근 가능
const USER_CONFIG = [
  {
    username: "chun",
    password: process.env.USER1_PASSWORD,
    name: "기정",
    id: "1",
    supabaseUserId: process.env.USER1_SUPABASE_ID,
  },
  {
    username: "haneul",
    password: process.env.USER2_PASSWORD,
    name: "하늘",
    id: "2",
    supabaseUserId: process.env.USER2_SUPABASE_ID,
  },
  {
    username: "test",
    password: process.env.TEST_USER_PASSWORD,
    name: "테스트",
    id: "3",
    supabaseUserId: process.env.TEST_USER_SUPABASE_ID,
  },
].filter((user) => user.password); // 비밀번호가 설정된 사용자만 포함

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 사용자 인증
    const user = USER_CONFIG.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const userData: User = {
      id: user.id,
      username: user.username,
      name: user.name,
      supabaseUserId: user.supabaseUserId,
    };

    // 쿠키 설정
    const response = NextResponse.json({ success: true, user: userData });

    response.cookies.set("isAuthenticated", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    response.cookies.set("user", JSON.stringify(userData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("로그인 오류:", error);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


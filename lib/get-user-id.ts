// 현재 로그인한 사용자의 Supabase user_id를 가져오는 유틸리티
// 파일 기반 인증 시스템과 Supabase DB를 연결하기 위한 헬퍼

import { User } from "@/lib/auth";

export function getSupabaseUserId(): string | null {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr) as User;
    return user.supabaseUserId || user.id;
  } catch {
    return null;
  }
}

// 서버 사이드에서 쿠키에서 user_id 가져오기
export function getSupabaseUserIdFromCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;

  try {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    const userStr = cookies["user"];
    if (!userStr) return null;

    const user = JSON.parse(userStr) as User;
    return user.supabaseUserId || user.id;
  } catch {
    return null;
  }
}

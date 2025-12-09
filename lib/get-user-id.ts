// 현재 로그인한 사용자의 Supabase user_id를 가져오는 유틸리티
// 파일 기반 인증 시스템과 Supabase DB를 연결하기 위한 헬퍼

import { User } from "@/lib/auth";

// UUID 형식 검증 (예: 550e8400-e29b-41d4-a716-446655440000)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export function getSupabaseUserId(): string | null {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr) as User;
    const userId = user.supabaseUserId || user.id;
    
    // UUID 형식 검증
    if (userId && !isValidUUID(userId)) {
      console.error(
        "Supabase user_id가 올바른 UUID 형식이 아닙니다.",
        "환경 변수에 실제 Supabase UUID를 설정해주세요.",
        "현재 값:", userId
      );
      return null;
    }
    
    return userId;
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
    const userId = user.supabaseUserId || user.id;
    
    // UUID 형식 검증
    if (userId && !isValidUUID(userId)) {
      console.error(
        "Supabase user_id가 올바른 UUID 형식이 아닙니다.",
        "환경 변수에 실제 Supabase UUID를 설정해주세요.",
        "현재 값:", userId
      );
      return null;
    }
    
    return userId;
  } catch {
    return null;
  }
}

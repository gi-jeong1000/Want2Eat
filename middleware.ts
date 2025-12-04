import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 로그인 페이지는 항상 접근 가능
  if (pathname.startsWith("/login")) {
    // 로그인 페이지에서 이미 인증된 경우 홈으로 리다이렉트
    const isAuthenticated =
      request.cookies.get("isAuthenticated")?.value === "true";
    const user = request.cookies.get("user")?.value;
    
    if (isAuthenticated && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }

  // API 경로는 인증 체크 제외
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 인증 확인 (쿠키 기반)
  const isAuthenticated =
    request.cookies.get("isAuthenticated")?.value === "true";
  const user = request.cookies.get("user")?.value;

  // 로그인 페이지가 아닌 경우, 인증 확인
  if (!isAuthenticated || !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

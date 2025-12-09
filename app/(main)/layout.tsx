"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, List, LogOut } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // localStorage에서 사용자 정보 가져오기
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr) as User;
        setUser(userData);
      } catch (e) {
        console.error("사용자 정보 파싱 오류:", e);
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
      }
    }
  }, [setUser]);

  const handleLogout = async () => {
    try {
      // localStorage 삭제
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      setUser(null);

      // 쿠키 삭제를 위한 API 호출
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("로그아웃 API 호출 실패:", err);
      }

      // 로그인 페이지로 이동
      window.location.href = "/login";
    } catch (err) {
      console.error("로그아웃 중 오류 발생:", err);
      // 오류가 발생해도 로그인 페이지로 이동
      window.location.href = "/login";
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 데스크톱: 상단 네비게이션 */}
      <nav className="hidden md:block border-b bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
            >
              Want2Eat
            </Link>
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm text-muted-foreground">
                  {user.name}님
                </span>
              )}
              <div className="flex items-center gap-2">
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="지도 보기"
                    className="hover:bg-accent"
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/places">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="장소 목록"
                    className="hover:bg-accent"
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/add">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="장소 추가"
                    className="hover:bg-accent"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="로그아웃"
                  className="hover:bg-accent"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일: 상단 헤더 (제목만) */}
      <nav className="md:hidden border-b bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold text-primary hover:opacity-80 transition-opacity"
            >
              Want2Eat
            </Link>
            {user && (
              <span className="text-xs text-muted-foreground">
                {user.name}님
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* 모바일: 하단 네비게이션 */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50 backdrop-blur-sm bg-card/95"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex flex-col items-center gap-1 h-auto py-2"
                title="지도 보기"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-xs">지도</span>
              </Button>
            </Link>
            <Link href="/places" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex flex-col items-center gap-1 h-auto py-2"
                title="장소 목록"
              >
                <List className="h-5 w-5" />
                <span className="text-xs">목록</span>
              </Button>
            </Link>
            <Link href="/add" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex flex-col items-center gap-1 h-auto py-2"
                title="장소 추가"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">추가</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              onClick={handleLogout}
              title="로그아웃"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs">로그아웃</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}

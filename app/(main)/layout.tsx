"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, List, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";

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
    <div className="min-h-screen flex flex-col">
      {/* 데스크톱: 상단 네비게이션 */}
      <nav className="hidden md:block border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              {user && (
                <Link href="/profile">
                  <div className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">
                      {user.name}님
                    </span>
                  </div>
                </Link>
              )}
              <div className="flex items-center gap-1">
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="지도 보기"
                    className="h-9 w-9"
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/places">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="장소 목록"
                    className="h-9 w-9"
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/add">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="장소 추가"
                    className="h-9 w-9"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="로그아웃"
                  className="h-9 w-9"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일: 상단 헤더 (제목만) */}
      <nav className="md:hidden border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            {user && (
              <Link href="/profile">
                <div className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                  <span className="text-xs font-medium text-gray-700">
                    {user.name}님
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* 모바일: 하단 네비게이션 */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container mx-auto px-2 py-3">
          <div className="flex items-center justify-around">
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex flex-col items-center gap-1 h-auto py-2"
                title="지도 보기"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-xs font-medium">지도</span>
              </Button>
            </Link>
            <Link href="/places" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex flex-col items-center gap-1 h-auto py-2"
                title="장소 목록"
              >
                <List className="h-5 w-5" />
                <span className="text-xs font-medium">목록</span>
              </Button>
            </Link>
            <Link href="/add" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex flex-col items-center gap-1 h-auto py-2"
                title="장소 추가"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">추가</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              onClick={handleLogout}
              title="로그아웃"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs font-medium">로그아웃</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}

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
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
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
                <span className="text-sm text-muted-foreground hidden sm:inline">
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
      <main>{children}</main>
    </div>
  );
}

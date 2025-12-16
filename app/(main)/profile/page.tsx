"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User as UserIcon, Save, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr) as User;
        setName(userData.name || "");
      } catch (e) {
        console.error("사용자 정보 파싱 오류:", e);
      }
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // API를 통해 이름 업데이트
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "이름 변경에 실패했습니다.");
      }

      const data = await response.json();
      
      // localStorage 업데이트
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr) as User;
        const updatedUser = { ...userData, name: name.trim() };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "이름 변경에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => router.push("/login")}>로그인하기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        뒤로
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
          <p className="text-gray-600">내 정보를 확인하고 수정할 수 있습니다.</p>
        </div>

        {/* 프로필 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              프로필 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                value={user.username}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                아이디는 변경할 수 없습니다.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                  className="h-11"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  이름이 성공적으로 변경되었습니다.
                </div>
              )}

              <Button
                type="submit"
                disabled={isSaving || name.trim() === user.name}
                className="w-full h-11"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장하기
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 통계 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>내 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  <UserStats userId={user.id} type="places" />
                </div>
                <div className="text-sm text-gray-600">저장한 장소</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  <UserStats userId={user.id} type="posts" />
                </div>
                <div className="text-sm text-gray-600">작성한 포스팅</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 사용자 통계 컴포넌트
function UserStats({ userId, type }: { userId: string; type: "places" | "posts" }) {
  const { data, isLoading } = useQuery({
    queryKey: ["userStats", userId, type],
    queryFn: async () => {
      const response = await fetch(`/api/user/stats?type=${type}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    },
  });

  if (isLoading) {
    return <span className="text-gray-400">-</span>;
  }

  return <span>{data ?? 0}</span>;
}


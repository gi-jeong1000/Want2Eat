"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { Place, PlaceWithImages } from "@/types";
import { PlaceCard } from "@/components/places/PlaceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

import { PlaceStatus } from "@/types";

export default function PlacesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PlaceStatus>("all");
  const supabase = createClient();

  const { data: places, isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: async () => {
      // 환경 변수가 없으면 빈 배열 반환 (UI 확인용)
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        return [];
      }

      // 파일 기반 인증에서 user_id 가져오기
      const userId = getSupabaseUserId();
      if (!userId) return [];

      // 자신의 장소 + 공유받은 장소 조회
      const { data: placesData, error: placesError } = await supabase
        .from("places")
        .select("*")
        .order("created_at", { ascending: false });

      if (placesError) {
        console.error("Supabase 연결 오류:", placesError);
        return [];
      }

      const { data: imagesData, error: imagesError } = await supabase
        .from("place_images")
        .select("*");

      if (imagesError) {
        console.error("이미지 조회 오류:", imagesError);
        return (placesData as Place[]).map((place) => ({
          ...place,
          images: [],
        }));
      }

      // 포스팅도 함께 가져오기
      const { data: postsData } = await supabase
        .from("place_posts")
        .select("*");

      const imagesDataTyped = (imagesData || []) as any[];
      const postsDataTyped = (postsData || []) as any[];
      
      const placesWithImages: PlaceWithImages[] = (placesData as Place[]).map(
        (place) => ({
          ...place,
          images: imagesDataTyped.filter((img) => img.place_id === place.id),
          posts:
            postsDataTyped
              ?.filter((post) => post.place_id === place.id)
              .map((post) => ({
                ...post,
                images: [],
              })) || [],
        })
      );

      return placesWithImages;
    },
  });

  const filteredPlaces = places?.filter((place) => {
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || place.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">장소 목록</h1>
        <p className="text-muted-foreground mb-6">
          저장한 장소를 확인하고 관리하세요
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="장소명 또는 주소로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | PlaceStatus)
            }
            className="h-11 px-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">전체</option>
            <option value="want_to_go">갈 곳</option>
            <option value="visited">갔던 곳</option>
            <option value="want_to_visit_again">또 가고 싶은 곳</option>
          </select>
        </div>
      </div>

      {filteredPlaces && filteredPlaces.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            총 {filteredPlaces.length}개의 장소
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || filterStatus !== "all"
              ? "검색 결과가 없습니다"
              : "저장된 장소가 없습니다"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || filterStatus !== "all"
              ? "다른 검색어나 필터를 시도해보세요"
              : "첫 번째 장소를 추가해보세요"}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Link href="/add">
              <Button size="lg">장소 추가하기</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

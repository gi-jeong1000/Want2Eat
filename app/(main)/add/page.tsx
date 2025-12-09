"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { searchPlaces, convertMapCoordinates } from "@/lib/naver/search";
import { NaverPlace } from "@/types";
import { PlaceForm } from "@/components/places/PlaceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export default function AddPlacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NaverPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NaverPlace | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // 네이버 검색 API 키가 없으면 에러 메시지 표시
    if (
      !process.env.NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID ||
      process.env.NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID.includes("your_")
    ) {
      alert(
        "네이버 검색 API 키가 설정되지 않았습니다. UI만 확인할 수 있습니다."
      );
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
    } catch (error: any) {
      console.error("검색 실패:", error);
      const errorMessage = error.message || "장소 검색에 실패했습니다.";
      alert(`검색 실패: ${errorMessage}\n\n네이버 검색 API 키와 서비스 URL 설정을 확인해주세요.`);
    } finally {
      setIsSearching(false);
    }
  };

  const createPlaceMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      naver_place_id: string | null;
      rating: number | null;
      comment: string | null;
      images: File[];
      status: "want_to_go" | "visited" | "want_to_visit_again";
    }) => {
      // 환경 변수가 없으면 에러 발생
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }

      // 파일 기반 인증에서 user_id 가져오기
      const userId = getSupabaseUserId();
      if (!userId) throw new Error("로그인이 필요합니다.");

      // 장소 생성
      const { data: place, error: placeError } = await supabase
        .from("places")
        .insert({
          user_id: userId,
          name: data.name,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          naver_place_id: data.naver_place_id,
          rating: data.rating,
          comment: data.comment,
          status: data.status,
        } as any)
        .select()
        .single();

      if (placeError) throw placeError;

      // 타입 단언
      const placeData = place as { id: string } | null;

      // 이미지 업로드
      if (data.images.length > 0 && placeData) {
        const uploadPromises = data.images.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${placeData.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("place-images")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("place-images").getPublicUrl(fileName);

          return {
            place_id: placeData.id,
            image_url: publicUrl,
          };
        });

        const imageData = await Promise.all(uploadPromises);

        const { error: imagesError } = await supabase
          .from("place_images")
          .insert(imageData as any);

        if (imagesError) throw imagesError;
      }

      return place;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      router.push("/places");
    },
  });

  const handleSelectPlace = (place: NaverPlace) => {
    setSelectedPlace(place);
    setSearchResults([]);
  };

  const handleSubmit = (formData: {
    comment: string;
    images: File[];
    status: string;
  }) => {
    if (!selectedPlace) return;

    const { lat, lng } = convertMapCoordinates(
      selectedPlace.mapx,
      selectedPlace.mapy
    );

    // 네이버 별점 정보는 검색 API에서 제공하지 않으므로 null로 설정
    // 실제로는 네이버 지도 API의 장소 상세 정보 API를 사용하여 별점을 가져올 수 있습니다.

    createPlaceMutation.mutate({
      name: selectedPlace.title.replace(/<[^>]*>/g, ""), // HTML 태그 제거
      address: selectedPlace.roadAddress || selectedPlace.address,
      latitude: lat,
      longitude: lng,
      naver_place_id: selectedPlace.placeId || null,
      rating: null, // 별점은 별도 API로 가져와야 함
      comment: formData.comment || null,
      images: formData.images,
      status: formData.status as
        | "want_to_go"
        | "visited"
        | "want_to_visit_again",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">장소 추가</h1>
        <p className="text-muted-foreground">
          네이버 검색으로 장소를 찾아 저장하세요
        </p>
      </div>

      {!selectedPlace ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              장소 검색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="장소명을 입력하세요 (예: 강남역 맛집)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-11"
                />
                <Button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="h-11 px-6"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      검색
                    </>
                  )}
                </Button>
              </div>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    검색 결과 ({searchResults.length}개)
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {searchResults.map((place, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:bg-accent hover:shadow-md transition-all duration-200 border-l-4 border-l-primary"
                      onClick={() => handleSelectPlace(place)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-base mb-1">
                          {place.title.replace(/<[^>]*>/g, "")}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {place.roadAddress || place.address}
                        </p>
                        {place.category && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {place.category.split(">").pop()?.trim()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="mt-6 text-center py-8 text-muted-foreground">
                <p>검색 결과가 없습니다.</p>
                <p className="text-sm mt-1">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedPlace(null)}
            className="mb-4"
          >
            ← 검색으로 돌아가기
          </Button>
          <PlaceForm
            place={selectedPlace}
            onSubmit={handleSubmit}
            onCancel={() => setSelectedPlace(null)}
            isLoading={createPlaceMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}

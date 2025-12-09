"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { searchPlaces } from "@/lib/kakao/search";
import { KakaoPlace } from "@/types";
import { PlaceForm } from "@/components/places/PlaceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export default function AddPlacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
    } catch (error: any) {
      console.error("검색 실패:", error);
      const errorMessage = error.message || "장소 검색에 실패했습니다.";
      alert(`검색 실패: ${errorMessage}\n\n카카오 검색 API 키 설정을 확인해주세요.`);
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
      if (!userId) {
        throw new Error(
          "장소 저장을 위해 Supabase User ID가 필요합니다.\n\n" +
          "해결 방법:\n" +
          "1. Supabase 대시보드 > Authentication > Users에서 UUID 확인\n" +
          "2. Vercel 환경 변수에 USER1_SUPABASE_ID 설정\n" +
          "3. 재배포 후 다시 시도\n\n" +
          "자세한 가이드: docs/SUPABASE_USER_ID_SETUP.md"
        );
      }

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

  const handleSelectPlace = (place: KakaoPlace) => {
    setSelectedPlace(place);
    setSearchResults([]);
  };

  const handleSubmit = (formData: {
    comment: string;
    images: File[];
    status: string;
  }) => {
    if (!selectedPlace) return;

    createPlaceMutation.mutate({
      name: selectedPlace.place_name,
      address: selectedPlace.road_address_name || selectedPlace.address_name,
      latitude: parseFloat(selectedPlace.y),
      longitude: parseFloat(selectedPlace.x),
      naver_place_id: selectedPlace.id,
      rating: null,
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
          카카오 맵 검색으로 장소를 찾아 저장하세요
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
                          {place.place_name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {place.road_address_name || place.address_name}
                        </p>
                        {place.category_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {place.category_name}
                          </p>
                        )}
                        {place.phone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📞 {place.phone}
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

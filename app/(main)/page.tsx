"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { loadNaverMapScript } from "@/lib/naver/map";
import { searchPlaces, convertMapCoordinates } from "@/lib/naver/search";
import { Place, NaverPlace } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [searchMarkers, setSearchMarkers] = useState<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NaverPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

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
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase 연결 오류:", error);
        return [];
      }
      return data as Place[];
    },
  });

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        // 네이버 지도 API 키가 없으면 지도 대신 플레이스홀더 표시
        if (
          !process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ||
          process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID.includes("your_")
        ) {
          console.log(
            "네이버 지도 API 키가 설정되지 않았습니다. 지도는 표시되지 않습니다."
          );
          setMapError("네이버 지도 API 키가 설정되지 않았습니다.");
          return;
        }

        await loadNaverMapScript();

        if (!window.naver || !window.naver.maps) {
          const errorMsg =
            "네이버 지도 API를 로드할 수 없습니다. Client ID와 도메인 설정을 확인하세요.";
          console.error(errorMsg);
          setMapError(errorMsg);
          return;
        }

        try {
          const mapInstance = new window.naver.maps.Map(mapRef.current, {
            center: new window.naver.maps.LatLng(37.5665, 126.978),
            zoom: 13,
          });

          // 지도 생성 성공 확인
          if (mapInstance) {
            setMap(mapInstance);
            setMapError(null);
          } else {
            throw new Error("지도 인스턴스 생성 실패");
          }
        } catch (mapError: any) {
          throw new Error(
            `지도 생성 실패: ${mapError.message || "알 수 없는 오류"}`
          );
        }
      } catch (error: any) {
        const errorMsg = error.message || "지도 초기화 실패";
        console.error("지도 초기화 실패:", errorMsg);
        setMapError(errorMsg);
      }
    };

    initMap();
  }, []);

  // 저장된 장소 마커 표시
  useEffect(() => {
    if (!map || !places || !window.naver) return;

    // 기존 저장된 장소 마커 제거
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: any[] = [];

    places.forEach((place) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(place.latitude, place.longitude),
        map: map,
        title: place.name,
        icon: {
          content: `
            <div style="
              background-color: #3b82f6;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">📍</div>
          `,
          anchor: new window.naver.maps.Point(15, 15),
        },
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 150px;">
            <h3 style="margin: 0 0 5px 0; font-weight: bold;">${place.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${
              place.address
            }</p>
            ${
              place.rating
                ? `<p style="margin: 5px 0 0 0; font-size: 12px;">⭐ ${place.rating}</p>`
                : ""
            }
            <button 
              onclick="window.open('/places/${place.id}', '_blank')"
              style="
                margin-top: 8px;
                padding: 4px 8px;
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              "
            >상세보기</button>
          </div>
        `,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // 검색 결과가 없을 때만 저장된 장소 범위로 조정
    if (places.length > 0 && searchResults.length === 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      places.forEach((place) => {
        bounds.extend(
          new window.naver.maps.LatLng(place.latitude, place.longitude)
        );
      });
      map.fitBounds(bounds);
    }
  }, [map, places]);

  // 검색 결과 마커 표시
  useEffect(() => {
    if (!map || !searchResults.length || !window.naver) return;

    // 기존 검색 마커 제거
    searchMarkers.forEach((marker) => marker.setMap(null));
    const newSearchMarkers: any[] = [];

    searchResults.forEach((place) => {
      const { lat, lng } = convertMapCoordinates(place.mapx, place.mapy);
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(lat, lng),
        map: map,
        title: place.title.replace(/<[^>]*>/g, ""),
        icon: {
          content: `
            <div style="
              background-color: #ef4444;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">🔍</div>
          `,
          anchor: new window.naver.maps.Point(15, 15),
        },
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 5px 0; font-weight: bold;">${place.title.replace(
              /<[^>]*>/g,
              ""
            )}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${
              place.roadAddress || place.address
            }</p>
            ${
              place.category
                ? `<p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">${place.category
                    .split(">")
                    .pop()
                    ?.trim()}</p>`
                : ""
            }
            <button 
              onclick="window.handleSavePlace && window.handleSavePlace('${place.title
                .replace(/<[^>]*>/g, "")
                .replace(/'/g, "\\'")}', '${(
          place.roadAddress || place.address
        ).replace(/'/g, "\\'")}', '${place.mapx}', '${place.mapy}', '${
          place.placeId || ""
        }')"
              style="
                margin-top: 8px;
                padding: 6px 12px;
                background-color: #10b981;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                width: 100%;
              "
            >저장하기</button>
          </div>
        `,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        infoWindow.open(map, marker);
      });

      newSearchMarkers.push(marker);
    });

    setSearchMarkers(newSearchMarkers);

    // 검색 결과 범위로 지도 조정
    if (searchResults.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      searchResults.forEach((place) => {
        const { lat, lng } = convertMapCoordinates(place.mapx, place.mapy);
        bounds.extend(new window.naver.maps.LatLng(lat, lng));
      });
      map.fitBounds(bounds);
    }
  }, [map, searchResults]);

  // 검색 핸들러
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (
      !process.env.NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID ||
      process.env.NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID.includes("your_")
    ) {
      alert("네이버 검색 API 키가 설정되지 않았습니다.");
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error("검색 실패:", error);
      const errorMessage = error.message || "장소 검색에 실패했습니다.";
      alert(
        `검색 실패: ${errorMessage}\n\n네이버 검색 API 키와 서비스 URL 설정을 확인해주세요.`
      );
    } finally {
      setIsSearching(false);
    }
  };

  // 장소 저장 mutation
  const savePlaceMutation = useMutation({
    mutationFn: async (place: NaverPlace) => {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }

      const userId = getSupabaseUserId();
      if (!userId) throw new Error("로그인이 필요합니다.");

      const { lat, lng } = convertMapCoordinates(place.mapx, place.mapy);

      const { data, error } = await supabase
        .from("places")
        .insert({
          user_id: userId,
          name: place.title.replace(/<[^>]*>/g, ""),
          address: place.roadAddress || place.address,
          latitude: lat,
          longitude: lng,
          naver_place_id: place.placeId || null,
          rating: null,
          comment: null,
          status: "want_to_go",
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchQuery("");
      alert("장소가 저장되었습니다!");
    },
    onError: (error: any) => {
      console.error("저장 실패:", error);
      alert(
        "장소 저장에 실패했습니다: " + (error.message || "알 수 없는 오류")
      );
    },
  });

  // 전역 함수로 저장 핸들러 등록
  useEffect(() => {
    (window as any).handleSavePlace = (
      name: string,
      address: string,
      mapx: string,
      mapy: string,
      placeId: string
    ) => {
      const place: NaverPlace = {
        title: name,
        address: address,
        roadAddress: address,
        mapx,
        mapy,
        placeId: placeId || undefined,
        link: "",
        category: "",
        description: "",
        telephone: "",
      };
      savePlaceMutation.mutate(place);
    };

    return () => {
      delete (window as any).handleSavePlace;
    };
  }, [savePlaceMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  const hasMapApi =
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID &&
    !process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID.includes("your_");

  return (
    <div className="relative md:h-[calc(100vh-64px)] h-[calc(100vh-128px)]">
      {hasMapApi ? (
        <>
          {mapError ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
              <Card className="max-w-md mx-4 border-red-200">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4 text-red-600">
                    지도 로드 실패
                  </h2>
                  <p className="text-muted-foreground mb-4">{mapError}</p>
                  <div className="text-sm text-left bg-red-50 p-4 rounded-md mt-4">
                    <p className="font-semibold mb-2">확인 사항:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>네이버 클라우드 플랫폼에서 Application 등록 확인</li>
                      <li>
                        서비스 URL에 Vercel 도메인 추가
                        (https://your-app.vercel.app)
                      </li>
                      <li>Client ID가 올바르게 입력되었는지 확인</li>
                      <li>환경 변수 설정 후 재배포 필요</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div ref={mapRef} className="w-full h-full" />

              {/* 검색 바 */}
              <div className="absolute top-4 left-4 right-4 z-[100] max-w-md">
                <Card className="shadow-lg">
                  <CardContent className="p-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="장소 검색 (예: 강남역 맛집)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-10"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        size="sm"
                        className="h-10 px-4"
                      >
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                      {searchQuery && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResults([]);
                            setShowSearchResults(false);
                            // 검색 마커 제거
                            searchMarkers.forEach((marker) =>
                              marker.setMap(null)
                            );
                            setSearchMarkers([]);
                          }}
                          className="h-10 px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* 검색 결과 리스트 */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-24 left-4 right-4 z-[100] max-w-md max-h-[60vh] overflow-y-auto">
                  <Card className="shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">
                          검색 결과 ({searchResults.length}개)
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSearchResults(false);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {searchResults.map((place, index) => {
                          const { lat, lng } = convertMapCoordinates(
                            place.mapx,
                            place.mapy
                          );
                          return (
                            <Card
                              key={index}
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => {
                                // 지도 중심 이동
                                if (map && window.naver) {
                                  map.setCenter(
                                    new window.naver.maps.LatLng(lat, lng)
                                  );
                                  map.setZoom(16);
                                }
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 truncate">
                                      {place.title.replace(/<[^>]*>/g, "")}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {place.roadAddress || place.address}
                                    </p>
                                    {place.category && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {place.category
                                          .split(">")
                                          .pop()
                                          ?.trim()}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      savePlaceMutation.mutate(place);
                                    }}
                                    disabled={savePlaceMutation.isPending}
                                    className="h-8 px-3 text-xs flex-shrink-0"
                                  >
                                    {savePlaceMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Plus className="h-3 w-3 mr-1" />
                                        저장
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 저장된 장소 개수 표시 */}
              {places && places.length > 0 && (
                <div className="absolute bottom-4 right-4 z-[100]">
                  <Card className="shadow-lg">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">
                        저장된 장소: {places.length}개
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">지도 미리보기</h2>
              <p className="text-muted-foreground mb-4">
                네이버 지도 API 키를 설정하면 지도가 표시됩니다.
              </p>
              <p className="text-sm text-muted-foreground">
                현재는 UI 구성만 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

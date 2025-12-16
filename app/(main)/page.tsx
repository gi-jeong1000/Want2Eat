"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { loadKakaoMapScript } from "@/lib/kakao/map";
import { searchPlaces } from "@/lib/kakao/search";
import { getPlaceDetail } from "@/lib/kakao/place";
import { Place, KakaoPlace } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, Plus, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [searchMarkers, setSearchMarkers] = useState<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<any>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const currentInfoWindowRef = useRef<any>(null); // 현재 열려있는 인포윈도우 추적
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: places, isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: async () => {
      // 서버 사이드 API를 통해 조회 (RLS 정책 우회)
      const response = await fetch("/api/places", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("장소 조회 오류:", errorData.error || "알 수 없는 오류");
        return [];
      }

      const data = await response.json();
      return data as Place[];
    },
  });

  useEffect(() => {
    // mapRef가 준비될 때까지 대기
    const checkAndInitMap = () => {
      if (!mapRef.current) {
        // mapRef가 아직 준비되지 않았으면 다시 시도
        setTimeout(checkAndInitMap, 100);
        return;
      }

      // 이미 지도가 초기화되어 있으면 재초기화하지 않음
      if (map) {
        setIsMapLoading(false);
        return;
      }

      initMap();
    };

    const initMap = async () => {
      setIsMapLoading(true);
      try {
        // 카카오 맵 API 키가 없으면 지도 대신 플레이스홀더 표시
        if (
          !process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
          process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY.includes("your_")
        ) {
          console.log(
            "카카오 맵 API 키가 설정되지 않았습니다. 지도는 표시되지 않습니다."
          );
          setMapError("카카오 맵 API 키가 설정되지 않았습니다.");
          setIsMapLoading(false);
          return;
        }

        await loadKakaoMapScript();

        if (!window.kakao || !window.kakao.maps) {
          const errorMsg =
            "카카오 맵 API를 로드할 수 없습니다. API 키 설정을 확인하세요.";
          console.error(errorMsg);
          setMapError(errorMsg);
          setIsMapLoading(false);
          return;
        }

        // 컨테이너가 준비될 때까지 대기
        let retryCount = 0;
        const maxRetries = 20; // 최대 2초 대기 (100ms * 20)

        const waitForContainer = (): Promise<HTMLDivElement> => {
          return new Promise((resolve, reject) => {
            const checkContainer = () => {
              const container = mapRef.current;
              if (
                container &&
                container.offsetWidth > 0 &&
                container.offsetHeight > 0
              ) {
                resolve(container);
              } else if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(checkContainer, 100);
              } else {
                reject(new Error("지도 컨테이너를 찾을 수 없습니다."));
              }
            };
            checkContainer();
          });
        };

        const container = await waitForContainer();

        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
          // 모바일에서 확대 방지
          draggable: true,
          scrollwheel: false, // 마우스 휠로 확대/축소 비활성화
          disableDoubleClick: true, // 더블클릭 확대 비활성화
          disableDoubleClickZoom: true, // 더블클릭 줌 비활성화
          keyboardShortcuts: false, // 키보드 단축키 비활성화
        };

        const mapInstance = new window.kakao.maps.Map(container, options);
        
        // 터치 이벤트로 확대/축소 방지
        mapInstance.setZoomable(false);
        
        // 터치 제스처로 확대 방지 (모바일)
        if (container) {
          let lastTouchEnd = 0;
          container.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
              event.preventDefault();
            }
            lastTouchEnd = now;
          }, false);
          
          // 핀치 줌 방지
          container.addEventListener('touchmove', (event) => {
            if (event.touches.length > 1) {
              event.preventDefault();
            }
          }, { passive: false });
        }

        // 지도 생성 성공 확인
        if (mapInstance) {
          setMap(mapInstance);
          setMapError(null);
          setIsMapLoading(false);
        } else {
          throw new Error("지도 인스턴스 생성 실패");
        }
      } catch (error: any) {
        const errorMsg = error.message || "지도 초기화 실패";
        console.error("지도 초기화 실패:", errorMsg);
        setMapError(errorMsg);
        setIsMapLoading(false);
      }
    };

    // 약간의 지연 후 초기화 시작 (DOM이 완전히 렌더링된 후)
    const timer = setTimeout(() => {
      checkAndInitMap();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 한 번만 실행, map이 없을 때만 초기화

  // 저장된 장소 마커 표시
  useEffect(() => {
    if (!map || !places || !window.kakao) return;

    // 기존 저장된 장소 마커 제거
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: any[] = [];

    places.forEach((place) => {
      const markerPosition = new window.kakao.maps.LatLng(
        place.latitude,
        place.longitude
      );

      // 커스텀 마커 이미지 생성
      const imageSrc =
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png";
      const imageSize = new window.kakao.maps.Size(30, 30);
      const imageOption = { offset: new window.kakao.maps.Point(15, 30) };
      const markerImage = new window.kakao.maps.MarkerImage(
        imageSrc,
        imageSize,
        imageOption
      );

      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        image: markerImage,
        map: map,
        title: place.name,
      });

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
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

      window.kakao.maps.event.addListener(marker, "click", () => {
        // 이전 인포윈도우 닫기
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
        }
        // 새 인포윈도우 열기
        infowindow.open(map, marker);
        currentInfoWindowRef.current = infowindow;
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // 검색 결과가 없을 때만 저장된 장소 범위로 조정
    if (places.length > 0 && searchResults.length === 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      places.forEach((place) => {
        bounds.extend(
          new window.kakao.maps.LatLng(place.latitude, place.longitude)
        );
      });
      map.setBounds(bounds);
    }
  }, [map, places, searchResults]);

  // 검색 결과 마커 표시
  useEffect(() => {
    if (!map || !searchResults.length || !window.kakao) return;

    // 기존 검색 마커 제거
    searchMarkers.forEach((marker) => marker.setMap(null));
    const newSearchMarkers: any[] = [];

    searchResults.forEach((place) => {
      const markerPosition = new window.kakao.maps.LatLng(
        parseFloat(place.y),
        parseFloat(place.x)
      );

      // 검색 결과용 커스텀 마커
      const imageSrc =
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_orange.png";
      const imageSize = new window.kakao.maps.Size(30, 30);
      const imageOption = { offset: new window.kakao.maps.Point(15, 30) };
      const markerImage = new window.kakao.maps.MarkerImage(
        imageSrc,
        imageSize,
        imageOption
      );

      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        image: markerImage,
        map: map,
        title: place.place_name,
      });

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 5px 0; font-weight: bold;">${
              place.place_name
            }</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${
              place.road_address_name || place.address_name
            }</p>
            ${
              place.category_name
                ? `<p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">${place.category_name}</p>`
                : ""
            }
            ${
              place.phone
                ? `<p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">📞 ${place.phone}</p>`
                : ""
            }
            <button 
              onclick="window.handleShowPlaceDetail && window.handleShowPlaceDetail('${
                place.id
              }')"
              style="
                margin-top: 8px;
                padding: 4px 8px;
                background-color: #10b981;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-right: 4px;
              "
            >상세정보</button>
            <button 
              onclick="window.handleSavePlace && window.handleSavePlace('${place.place_name.replace(
                /'/g,
                "\\'"
              )}', '${(place.road_address_name || place.address_name).replace(
          /'/g,
          "\\'"
        )}', '${place.y}', '${place.x}', '${place.id}')"
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
            >저장하기</button>
          </div>
        `,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        // 이전 인포윈도우 닫기
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
        }
        // 새 인포윈도우 열기
        infowindow.open(map, marker);
        currentInfoWindowRef.current = infowindow;
      });

      newSearchMarkers.push(marker);
    });

    setSearchMarkers(newSearchMarkers);

    // 검색 결과 범위로 지도 조정
    if (searchResults.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      searchResults.forEach((place) => {
        bounds.extend(
          new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x))
        );
      });
      map.setBounds(bounds);
    }
  }, [map, searchResults]);

  // 검색 핸들러
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      setSearchError(null);
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      // 검색 결과가 없어도 카드를 표시
      setShowSearchResults(true);
      if (results.length === 0) {
        setSearchError("검색 결과가 없습니다.");
      }
    } catch (error: any) {
      console.error("검색 실패:", error);
      const errorMessage = error.message || "장소 검색에 실패했습니다.";
      setSearchError(errorMessage);
      setSearchResults([]);
      // 에러가 발생해도 카드를 표시하여 메시지를 보여줌
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // 장소 상세 정보 조회
  const handleShowPlaceDetail = async (placeId: string) => {
    try {
      // 인포윈도우 닫기
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
      }
      const detail = await getPlaceDetail(placeId);
      setSelectedPlaceDetail(detail);
    } catch (error: any) {
      console.error("상세 정보 조회 실패:", error);
      alert("상세 정보를 불러올 수 없습니다.");
    }
  };

  // 장소 저장 mutation
  const savePlaceMutation = useMutation({
    mutationFn: async (place: KakaoPlace) => {
      // 서버 사이드 API를 통해 저장 (RLS 정책 우회)
      const response = await fetch("/api/places/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: place.place_name,
          address: place.road_address_name || place.address_name,
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x),
          naver_place_id: place.id,
          rating: null,
          comment: null,
          status: "want_to_go",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "장소 저장에 실패했습니다.");
      }

      const data = await response.json();
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
      lat: string,
      lng: string,
      placeId: string
    ) => {
      const place: KakaoPlace = {
        id: placeId,
        place_name: name,
        address_name: address,
        road_address_name: address,
        x: lng,
        y: lat,
        category_name: "",
        category_group_code: "",
        category_group_name: "",
        phone: "",
        place_url: "",
      };
      savePlaceMutation.mutate(place);
    };

    (window as any).handleShowPlaceDetail = (placeId: string) => {
      handleShowPlaceDetail(placeId);
    };

    return () => {
      delete (window as any).handleSavePlace;
      delete (window as any).handleShowPlaceDetail;
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
    process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY &&
    !process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY.includes("your_");

  return (
    <div className="relative md:h-[calc(100vh-64px)] h-[calc(100vh-128px)]">
      {hasMapApi ? (
        <>
          {mapError ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
              <Card className="max-w-md mx-4 border-red-200/50 shadow-soft-lg">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4 text-red-500">
                    지도 로드 실패
                  </h2>
                  <p className="text-muted-foreground mb-4">{mapError}</p>
                  <div className="text-sm text-left bg-red-50/50 p-4 rounded-xl mt-4 border border-red-100">
                    <p className="font-semibold mb-2">확인 사항:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>카카오 개발자 콘솔에서 애플리케이션 등록 확인</li>
                      <li>플랫폼 설정에 도메인 추가</li>
                      <li>JavaScript 키가 올바르게 입력되었는지 확인</li>
                      <li>환경 변수 설정 후 재배포 필요</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {isMapLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">지도 로딩 중...</p>
                  </div>
                </div>
              )}
              <div ref={mapRef} className="w-full h-full" />

              {/* 검색 바 - iOS 17 Glass 디자인 */}
              <div className={`fixed md:absolute left-0 right-0 md:left-4 md:right-4 z-[100] max-w-md md:mx-auto px-4 md:px-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                isSearchExpanded 
                  ? "top-20 md:top-6 translate-y-0 opacity-100 scale-100" 
                  : "top-4 md:top-6 -translate-y-full md:translate-y-0 opacity-0 md:opacity-100 scale-95 md:scale-100 pointer-events-none md:pointer-events-auto"
              }`}>
                <div className="glass-ios rounded-3xl shadow-2xl backdrop-blur-2xl border border-white/20 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <form onSubmit={handleSearch} className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none" />
                            <Input
                              placeholder="장소 검색 (예: 강남역 맛집)"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-12 h-11 rounded-2xl border-white/30 bg-white/40 backdrop-blur-xl focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            size="lg"
                            className="h-11 px-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                          >
                            {isSearching ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Search className="h-5 w-5" />
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
                                setSelectedPlaceDetail(null);
                                // 인포윈도우 닫기
                                if (currentInfoWindowRef.current) {
                                  currentInfoWindowRef.current.close();
                                  currentInfoWindowRef.current = null;
                                }
                                searchMarkers.forEach((marker) =>
                                  marker.setMap(null)
                                );
                                setSearchMarkers([]);
                              }}
                              className="h-11 px-3 rounded-2xl bg-white/40 hover:bg-white/60"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </form>
                      </div>
                      {/* 접기/펼치기 버튼 (모바일만) */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                        className="md:hidden h-11 w-11 rounded-2xl bg-white/40 hover:bg-white/60 flex-shrink-0"
                      >
                        {isSearchExpanded ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 장소 상세 정보 모달 - iOS 17 Glass 디자인 */}
              {selectedPlaceDetail && (
                <div className="fixed md:absolute top-20 md:top-24 left-0 right-0 md:left-4 md:right-4 z-[100] max-w-md md:mx-auto px-4 md:px-0 animate-ios-spring">
                  <div className="glass-ios rounded-3xl shadow-2xl backdrop-blur-2xl border border-white/20 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-gray-900">
                          장소 상세 정보
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPlaceDetail(null);
                            // 인포윈도우 닫기
                            if (currentInfoWindowRef.current) {
                              currentInfoWindowRef.current.close();
                              currentInfoWindowRef.current = null;
                            }
                          }}
                          className="h-9 w-9 rounded-2xl bg-white/40 hover:bg-white/60"
                        >
                          <X className="h-4 w-4 text-gray-700" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-base text-gray-900 mb-1">
                            {selectedPlaceDetail.place_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {selectedPlaceDetail.road_address_name ||
                              selectedPlaceDetail.address_name}
                          </p>
                        </div>
                        {selectedPlaceDetail.phone && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">전화:</span>{" "}
                            {selectedPlaceDetail.phone}
                          </p>
                        )}
                        {selectedPlaceDetail.category_name && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">카테고리:</span>{" "}
                            {selectedPlaceDetail.category_name}
                          </p>
                        )}
                        {selectedPlaceDetail.menu_info && (
                          <div className="mt-3">
                            <p className="font-medium text-sm mb-1 text-gray-900">
                              메뉴 정보:
                            </p>
                            <div
                              className="text-sm text-gray-600 whitespace-pre-line"
                              dangerouslySetInnerHTML={{
                                __html: selectedPlaceDetail.menu_info,
                              }}
                            />
                          </div>
                        )}
                        {selectedPlaceDetail.homepage && (
                          <a
                            href={selectedPlaceDetail.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-block"
                          >
                            홈페이지 보기 →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 검색 결과 리스트 - iOS 17 Glass 디자인 */}
              {showSearchResults && (
                <div className={`fixed md:absolute left-0 right-0 md:left-4 md:right-4 z-[100] max-w-md md:mx-auto px-4 md:px-0 max-h-[calc(100vh-10rem)] overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                  isSearchExpanded 
                    ? "top-36 md:top-28 translate-y-0 opacity-100" 
                    : "top-20 md:top-28 translate-y-0 opacity-100"
                }`}>
                  <div className="glass-ios rounded-3xl shadow-2xl backdrop-blur-2xl border border-white/20 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-gray-900">
                          {searchResults.length > 0
                            ? `검색 결과 (${searchResults.length}개)`
                            : "검색 결과"}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchError(null);
                            // 인포윈도우 닫기
                            if (currentInfoWindowRef.current) {
                              currentInfoWindowRef.current.close();
                              currentInfoWindowRef.current = null;
                            }
                          }}
                          className="h-9 w-9 rounded-2xl bg-white/40 hover:bg-white/60"
                        >
                          <X className="h-4 w-4 text-gray-700" />
                        </Button>
                      </div>
                      {/* 검색 결과가 없거나 에러가 있을 때 */}
                      {(searchError || searchResults.length === 0) && (
                        <div className="py-8 text-center">
                          <p className="text-sm text-muted-foreground/70">
                            {searchError || "검색 결과가 없습니다."}
                          </p>
                          <p className="text-xs text-muted-foreground/50 mt-1">
                            다른 키워드로 검색해보세요.
                          </p>
                        </div>
                      )}
                      {/* 검색 결과 리스트 */}
                      {searchResults.length > 0 && (
                        <div className="space-y-3">
                          {searchResults.map((place) => {
                            return (
                              <div
                                key={place.id}
                                className="cursor-pointer rounded-2xl bg-white/50 hover:bg-white/70 backdrop-blur-xl border border-white/40 p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] animate-ios-fade"
                                onClick={() => {
                                  // 인포윈도우 닫기
                                  if (currentInfoWindowRef.current) {
                                    currentInfoWindowRef.current.close();
                                    currentInfoWindowRef.current = null;
                                  }
                                  // 지도 중심 이동
                                  if (map && window.kakao) {
                                    const moveLatLon =
                                      new window.kakao.maps.LatLng(
                                        parseFloat(place.y),
                                        parseFloat(place.x)
                                      );
                                    map.setCenter(moveLatLon);
                                    map.setLevel(3);
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1.5 truncate text-gray-900">
                                      {place.place_name}
                                    </h4>
                                    <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                                      {place.road_address_name ||
                                        place.address_name}
                                    </p>
                                    {place.category_name && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {place.category_name}
                                      </p>
                                    )}
                                    {place.phone && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        📞 {place.phone}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await handleShowPlaceDetail(place.id);
                                      }}
                                      className="h-8 px-3 text-xs rounded-xl bg-white/60 hover:bg-white/80 border-white/40"
                                    >
                                      상세
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        savePlaceMutation.mutate(place);
                                      }}
                                      disabled={savePlaceMutation.isPending}
                                      className="h-8 px-3 text-xs rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
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
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
          <Card className="max-w-md mx-4 shadow-soft-lg border-sky-100/50 animate-slide-up">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-sky-400 to-blue-400 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 gradient-text">지도 미리보기</h2>
              <p className="text-muted-foreground mb-4 text-base">
                카카오 맵 API 키를 설정하면 지도가 표시됩니다.
              </p>
              <p className="text-sm text-muted-foreground/70">
                현재는 UI 구성만 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

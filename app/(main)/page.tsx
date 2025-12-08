"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { loadNaverMapScript } from "@/lib/naver/map";
import { Place } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
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
          const errorMsg = "네이버 지도 API를 로드할 수 없습니다. Client ID와 도메인 설정을 확인하세요.";
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
          throw new Error(`지도 생성 실패: ${mapError.message || "알 수 없는 오류"}`);
        }
      } catch (error: any) {
        const errorMsg = error.message || "지도 초기화 실패";
        console.error("지도 초기화 실패:", errorMsg);
        setMapError(errorMsg);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!map || !places || !window.naver) return;

    // 기존 마커 제거
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: any[] = [];

    places.forEach((place) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(place.latitude, place.longitude),
        map: map,
        title: place.name,
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
          </div>
        `,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // 모든 마커가 보이도록 지도 범위 조정
    if (places.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      places.forEach((place) => {
        bounds.extend(
          new window.naver.maps.LatLng(place.latitude, place.longitude)
        );
      });
      map.fitBounds(bounds);
    }
  }, [map, places, markers]);

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
    <div className="h-screen relative">
      {hasMapApi ? (
        <>
          {mapError ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
              <Card className="max-w-md mx-4 border-red-200">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4 text-red-600">지도 로드 실패</h2>
                  <p className="text-muted-foreground mb-4">
                    {mapError}
                  </p>
                  <div className="text-sm text-left bg-red-50 p-4 rounded-md mt-4">
                    <p className="font-semibold mb-2">확인 사항:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>네이버 클라우드 플랫폼에서 Application 등록 확인</li>
                      <li>서비스 URL에 Vercel 도메인 추가 (https://your-app.vercel.app)</li>
                      <li>Client ID가 올바르게 입력되었는지 확인</li>
                      <li>환경 변수 설정 후 재배포 필요</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" />
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
      {places && places.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <Card>
            <CardContent className="p-3">
              <p className="text-sm font-medium">총 {places.length}개의 장소</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

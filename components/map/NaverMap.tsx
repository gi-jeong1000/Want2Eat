"use client";

import { useEffect, useRef } from "react";
import { loadNaverMapScript } from "@/lib/naver/map";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title: string;
    onClick?: () => void;
  }>;
  onMapLoad?: (map: any) => void;
}

export function NaverMap({
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 13,
  markers = [],
  onMapLoad,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        await loadNaverMapScript();

        if (!window.naver || !window.naver.maps) {
          console.error("네이버 지도 API를 로드할 수 없습니다.");
          return;
        }

        const map = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom,
        });

        mapInstanceRef.current = map;
        if (onMapLoad) {
          onMapLoad(map);
        }
      } catch (error) {
        console.error("지도 초기화 실패:", error);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver) return;

    // 기존 마커 제거
    const existingMarkers = mapInstanceRef.current._markers || [];
    existingMarkers.forEach((marker: any) => marker.setMap(null));

    // 새 마커 추가
    const newMarkers: any[] = [];
    markers.forEach((marker) => {
      const naverMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(marker.lat, marker.lng),
        map: mapInstanceRef.current,
        title: marker.title,
      });

      if (marker.onClick) {
        window.naver.maps.Event.addListener(naverMarker, "click", marker.onClick);
      }

      newMarkers.push(naverMarker);
    });

    mapInstanceRef.current._markers = newMarkers;

    // 모든 마커가 보이도록 지도 범위 조정
    if (markers.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend(new window.naver.maps.LatLng(marker.lat, marker.lng));
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [markers]);

  return <div ref={mapRef} className="w-full h-full" />;
}


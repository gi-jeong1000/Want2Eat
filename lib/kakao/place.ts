import { KakaoPlaceDetail } from "@/types";

export async function getPlaceDetail(placeName: string): Promise<KakaoPlaceDetail | null> {
  try {
    // 서버 사이드 API 라우트를 통해 장소 상세 정보 가져오기
    const response = await fetch(`/api/place/${encodeURIComponent(placeName)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // 404나 다른 오류는 null 반환 (에러로 처리하지 않음)
      return null;
    }

    const data: KakaoPlaceDetail = await response.json();
    
    // 에러 메시지만 있고 실제 데이터가 없는 경우
    if (data.error && !data.place_name) {
      return null;
    }
    
    return data;
  } catch (error) {
    // 네트워크 오류 등은 조용히 처리
    console.warn("카카오 맵 정보 조회 중 오류:", error);
    return null;
  }
}


import { KakaoPlaceDetail } from "@/types";

export async function getPlaceDetail(placeId: string): Promise<KakaoPlaceDetail> {
  // 서버 사이드 API 라우트를 통해 장소 상세 정보 가져오기
  const response = await fetch(`/api/place/${placeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error ||
      `장소 상세 정보 조회 실패 (${response.status}: ${response.statusText})`;
    throw new Error(errorMessage);
  }

  const data: KakaoPlaceDetail = await response.json();
  return data;
}


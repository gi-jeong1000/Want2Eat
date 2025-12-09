import { KakaoPlace, KakaoSearchResponse } from "@/types";

export async function searchPlaces(query: string): Promise<KakaoPlace[]> {
  // 서버 사이드 API 라우트를 통해 검색 (CORS 문제 해결)
  const response = await fetch(`/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error ||
      `검색 API 호출 실패 (${response.status}: ${response.statusText})`;
    throw new Error(errorMessage);
  }

  const data: KakaoSearchResponse = await response.json();
  
  if (!data.documents || !Array.isArray(data.documents)) {
    throw new Error("검색 결과 형식이 올바르지 않습니다.");
  }

  return data.documents;
}


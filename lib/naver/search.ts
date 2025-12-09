import { NaverSearchResponse, NaverPlace } from "@/types";

export async function searchPlaces(query: string): Promise<NaverPlace[]> {
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

  const data: NaverSearchResponse = await response.json();
  
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error("검색 결과 형식이 올바르지 않습니다.");
  }

  return data.items;
}

export function convertMapCoordinates(mapx: string, mapy: string): {
  lat: number;
  lng: number;
} {
  // 네이버 검색 API의 mapx, mapy는 KATEC 좌표계를 사용
  // 이를 WGS84 좌표계로 변환
  const x = parseFloat(mapx);
  const y = parseFloat(mapy);

  // KATEC to WGS84 변환
  // 네이버 지도 API v3의 좌표 변환 서비스를 사용하는 것이 가장 정확하지만,
  // 여기서는 근사치 변환 공식 사용
  
  // 간단한 변환 (더 정확한 변환을 위해서는 네이버 좌표 변환 API 사용 권장)
  // 네이버 검색 API의 좌표는 이미 일부 변환이 되어 있을 수 있으므로
  // 실제 테스트를 통해 조정이 필요할 수 있습니다.
  
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;

  const DEGRAD = Math.PI / 180.0;
  const RADDEG = 180.0 / Math.PI;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  const ra = Math.tan(Math.PI * 0.25 + (y / 100000) * DEGRAD * 0.5);
  const ra2 = re * sf / Math.pow(ra, sn);
  let theta = (x / 100000) * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const lat = (Math.atan(Math.pow(re / ra2, 1 / sn)) * 2 - Math.PI / 2) * RADDEG;
  const lng = (theta / sn + olon) * RADDEG;

  return { lat, lng };
}


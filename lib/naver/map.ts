declare global {
  interface Window {
    naver: any;
  }
}

export function loadNaverMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.naver && window.naver.maps) {
      resolve();
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId || clientId.includes("your_")) {
      reject(new Error("네이버 지도 API 키가 설정되지 않았습니다."));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("네이버 지도 스크립트 로드 실패"));
    document.head.appendChild(script);
  });
}

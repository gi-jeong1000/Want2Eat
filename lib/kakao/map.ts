declare global {
  interface Window {
    kakao: any;
  }
}

export function loadKakaoMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
    if (!appKey || appKey.includes("your_")) {
      reject(new Error("카카오 맵 API 키가 설정되지 않았습니다."));
      return;
    }

    // 기존 스크립트가 있으면 제거
    const existingScript = document.querySelector(
      'script[src*="dapi.kakao.com"]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;

    // 타임아웃 설정 (10초)
    const timeout = setTimeout(() => {
      reject(new Error("카카오 맵 스크립트 로드 타임아웃"));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      // 카카오 맵 SDK 로드
      window.kakao.maps.load(() => {
        resolve();
      });
    };

    script.onerror = () => {
      clearTimeout(timeout);
      reject(
        new Error(
          "카카오 맵 스크립트 로드 실패. 네트워크 오류 또는 API 키 확인이 필요합니다."
        )
      );
    };

    document.head.appendChild(script);
  });
}


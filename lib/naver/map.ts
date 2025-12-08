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

    // 기존 스크립트가 있으면 제거
    const existingScript = document.querySelector(
      'script[src*="oapi.map.naver.com"]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    
    // 타임아웃 설정 (10초)
    const timeout = setTimeout(() => {
      reject(new Error("네이버 지도 스크립트 로드 타임아웃"));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      // 약간의 지연 후 인증 실패 체크 (스크립트가 완전히 로드될 때까지 대기)
      setTimeout(() => {
        if (window.naver && window.naver.maps) {
          resolve();
        } else {
          // 인증 실패 시 에러 메시지 확인
          const errorElement = document.querySelector('.naver-map-error');
          const errorMessage = errorElement?.textContent || "네이버 지도 API 인증 실패";
          reject(new Error(`${errorMessage}. Client ID와 서비스 URL 설정을 확인하세요.`));
        }
      }, 100);
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("네이버 지도 스크립트 로드 실패. 네트워크 오류 또는 인증 실패일 수 있습니다."));
    };
    
    document.head.appendChild(script);
  });
}

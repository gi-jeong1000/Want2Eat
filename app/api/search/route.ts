import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query;

    if (!query) {
      return NextResponse.json(
        { error: "검색어가 필요합니다." },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_NAVER_SEARCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "네이버 검색 API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&sort=random`;

    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("네이버 검색 API 오류:", response.status, errorText);
      
      // 에러 응답 파싱 시도
      let errorMessage = "네이버 검색 API 호출에 실패했습니다.";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.errorMessage || errorMessage;
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
        errorMessage = errorText || errorMessage;
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          status: response.status,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("검색 API 서버 오류:", error);
    return NextResponse.json(
      { 
        error: error.message || "서버 오류가 발생했습니다.",
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

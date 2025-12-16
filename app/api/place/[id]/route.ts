import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: placeId } = await params;

    if (!placeId) {
      return NextResponse.json(
        { error: "장소 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const restApiKey = process.env.KAKAO_REST_API_KEY;

    if (!restApiKey) {
      return NextResponse.json(
        { error: "카카오 REST API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 카카오 로컬 API - 장소 상세 정보 조회
    // placeId는 장소 이름 또는 ID일 수 있음
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(placeId)}&size=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${restApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("카카오 장소 상세 API 오류:", response.status, errorText);
      
      let errorMessage = "카카오 장소 상세 정보 조회에 실패했습니다.";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
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
    
    // 첫 번째 결과 반환 (모든 필드 포함)
    if (data.documents && data.documents.length > 0) {
      const place = data.documents[0];
      
      // 카카오 로컬 API 응답에는 이미지나 메뉴 정보가 직접 포함되지 않지만,
      // place_url을 통해 카카오맵에서 확인할 수 있음
      return NextResponse.json({
        ...place,
        // 카카오맵에서 이미지와 메뉴를 볼 수 있음을 명시
        has_kakao_map_info: !!place.place_url,
      });
    }

    return NextResponse.json(
      { error: "장소를 찾을 수 없습니다." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("장소 상세 API 서버 오류:", error);
    return NextResponse.json(
      { 
        error: error.message || "서버 오류가 발생했습니다.",
        details: error.stack 
      },
      { status: 500 }
    );
  }
}


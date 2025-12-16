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

    // 카카오 로컬 API - 키워드 검색으로 장소 정보 조회
    // placeId는 장소 이름으로 전달됨
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(placeId)}&size=5`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${restApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("카카오 장소 상세 API 오류:", response.status, errorText);
      
      // 404나 다른 오류는 조용히 처리 (카카오 맵 정보는 선택사항)
      return NextResponse.json(
        { 
          error: "카카오 맵 정보를 찾을 수 없습니다.",
          has_kakao_map_info: false,
        },
        { status: 200 } // 404 대신 200으로 반환하여 앱이 중단되지 않도록
      );
    }

    const data = await response.json();
    
    // 검색 결과 중 첫 번째 결과 반환
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

    // 검색 결과가 없어도 에러로 처리하지 않음
    return NextResponse.json(
      { 
        error: "카카오 맵 정보를 찾을 수 없습니다.",
        has_kakao_map_info: false,
      },
      { status: 200 } // 404 대신 200으로 반환
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


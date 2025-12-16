/**
 * Google Gemini API 클라이언트
 * 무료 티어 사용 (15 RPM, 1500 RPD)
 * 
 * 사용 모델: gemini-2.5-flash (최신 모델, 빠르고 무료 티어에 적합)
 * 대안: gemini-2.5-pro (더 강력하지만 느림)
 * 
 * 참고: 최신 모델 목록은 https://ai.google.dev/gemini-api/docs/models 참조
 */

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function generatePlaceSummary(
  placeName: string,
  address: string,
  category?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("Gemini API 키가 설정되지 않았습니다. AI 요약을 생성할 수 없습니다.");
    return "";
  }

  try {
    const prompt = `당신은 전문 음식 평론가입니다. 제공된 식당 정보를 바탕으로 상세한 평가를 작성해주세요.

식당 정보:
- 식당 이름: ${placeName}
- 정확한 주소: ${address}
${category ? `- 카테고리: ${category}` : ""}

반드시 다음 세 가지 정보를 모두 포함하여 응답해주세요:

1. 평점: 5점 만점 기준으로 평가 (소수점 첫째 자리까지, 예: 4.2, 4.5, 4.8)
2. 한줄평: 식당의 특징, 분위기, 추천 포인트를 간결하게 한 줄로 작성 (50-100자)
3. 추천 메뉴: 대표 메뉴 1-2개를 제시

응답 형식 (정확히 이 형식을 따라주세요):
평점: ⭐X.X/5.0
한줄평: [식당의 특징과 분위기를 간결하게 설명하는 한 줄 평가]
추천 메뉴: [메뉴명1, 메뉴명2]

예시 응답:
평점: ⭐4.3/5.0
한줄평: 신선한 재료와 정성스러운 요리로 유명한 곳으로, 분위기 좋은 데이트 코스로 추천합니다.
추천 메뉴: 특제 스테이크, 시그니처 파스타

중요: 
- 평점, 한줄평, 추천 메뉴 세 가지를 모두 반드시 포함해야 합니다.
- 평점만 작성하지 마세요. 반드시 세 가지를 모두 작성해주세요.
- 위 예시 형식을 정확히 따라주세요.
- 응답은 반드시 세 줄로 구성되어야 합니다: 평점 한 줄, 한줄평 한 줄, 추천 메뉴 한 줄.`;

    // 최신 Gemini API 모델 사용 (gemini-2.5-flash는 빠르고 무료 티어에 적합)
    const modelName = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey, // 헤더에도 API 키 포함 (권장 방식)
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300, // 충분한 응답을 위해 증가
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API 오류:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        apiKeyExists: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
      });
      
      // 에러 상세 정보 파싱
      try {
        const errorData = JSON.parse(errorText);
        console.error("Gemini API 에러 상세:", errorData);
        
        // 특정 에러 메시지 처리
        if (errorData.error?.message) {
          console.error("에러 메시지:", errorData.error.message);
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 텍스트 출력
        console.error("에러 응답 (텍스트):", errorText);
      }
      
      return "";
    }

    const data: GeminiResponse = await response.json();

    if (
      data.candidates &&
      data.candidates[0]?.content?.parts?.[0]?.text
    ) {
      const summary = data.candidates[0].content.parts[0].text.trim();
      
      // 응답에 세 가지 항목이 모두 포함되어 있는지 확인
      const hasRating = summary.includes("평점:");
      const hasReview = summary.includes("한줄평:");
      const hasMenu = summary.includes("추천 메뉴:");
      
      if (!hasRating || !hasReview || !hasMenu) {
        console.warn("Gemini API 응답이 형식에 맞지 않습니다:", {
          hasRating,
          hasReview,
          hasMenu,
          summary: summary.substring(0, 200),
        });
      }
      
      return summary;
    }

    return "";
  } catch (error) {
    console.error("Gemini API 호출 중 오류:", error);
    return "";
  }
}


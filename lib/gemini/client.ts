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

**중요: 반드시 다음 세 가지 정보를 모두 포함하여 응답해주세요. 평점만 작성하면 안 됩니다.**

1. 평점: 5점 만점 기준으로 평가 (소수점 첫째 자리까지, 예: 4.2, 4.5, 4.8)
2. 한줄평: 식당의 특징, 분위기, 추천 포인트를 간결하게 한 줄로 작성 (50-100자)
3. 추천 메뉴: 대표 메뉴 1-2개를 제시

**응답 형식 (정확히 이 형식을 따라주세요. 세 줄 모두 필수입니다):**
평점: ⭐X.X/5.0
한줄평: [식당의 특징과 분위기를 간결하게 설명하는 한 줄 평가]
추천 메뉴: [메뉴명1, 메뉴명2]

**예시 응답 (이 형식을 정확히 따라주세요):**
평점: ⭐4.3/5.0
한줄평: 신선한 재료와 정성스러운 요리로 유명한 곳으로, 분위기 좋은 데이트 코스로 추천합니다.
추천 메뉴: 특제 스테이크, 시그니처 파스타

**절대 지켜야 할 규칙:**
- 평점만 작성하면 안 됩니다.
- 반드시 세 가지(평점, 한줄평, 추천 메뉴)를 모두 작성해야 합니다.
- 각 항목은 반드시 "평점:", "한줄평:", "추천 메뉴:"로 시작해야 합니다.
- 응답은 반드시 세 줄로 구성되어야 합니다.`;

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
          temperature: 0.3, // 더 일관된 응답을 위해 낮춤
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500, // 충분한 응답을 위해 더 증가
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
      let summary = data.candidates[0].content.parts[0].text.trim();
      
      // 응답에 세 가지 항목이 모두 포함되어 있는지 확인
      const hasRating = summary.includes("평점:");
      const hasReview = summary.includes("한줄평:");
      const hasMenu = summary.includes("추천 메뉴:");
      
      console.log("Gemini API 응답 검증:", {
        hasRating,
        hasReview,
        hasMenu,
        summaryLength: summary.length,
        summaryPreview: summary.substring(0, 300),
      });
      
      // 평점만 있고 다른 정보가 없는 경우 경고 및 재시도 고려
      if (hasRating && (!hasReview || !hasMenu)) {
        console.warn("⚠️ Gemini API 응답이 불완전합니다. 평점만 있거나 일부 정보가 누락되었습니다:", {
          hasRating,
          hasReview,
          hasMenu,
          fullResponse: summary,
        });
        
        // 불완전한 응답이어도 반환 (사용자에게 표시)
        // 하지만 로그를 통해 문제를 추적할 수 있도록 함
        // 추후 재시도 로직을 추가할 수 있음
      }
      
      // 응답이 완전한지 최종 확인
      if (!hasRating || !hasReview || !hasMenu) {
        console.error("❌ Gemini API 응답이 불완전합니다. 모든 필수 항목이 포함되지 않았습니다:", {
          hasRating,
          hasReview,
          hasMenu,
          summaryLength: summary.length,
          summaryPreview: summary.substring(0, 200),
        });
      } else {
        console.log("✅ Gemini API 응답이 완전합니다. 모든 필수 항목이 포함되었습니다.");
      }
      
      return summary;
    }

    return "";
  } catch (error) {
    console.error("Gemini API 호출 중 오류:", error);
    return "";
  }
}


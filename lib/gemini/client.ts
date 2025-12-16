/**
 * Google Gemini API 클라이언트
 * 무료 티어 사용 (15 RPM, 1500 RPD)
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
    const prompt = `당신은 음식 평론가입니다.

지금부터 제공하는 식당 장소, 위치를 기반으로 가장 최신의 정보를 취합하여 식당에 대한 평점과 한줄평, 추천 메뉴를 간결하게 요약해주세요.

식당 정보:
- 식당 이름: ${placeName}
- 정확한 주소: ${address}
${category ? `- 카테고리: ${category}` : ""}

요구사항:
1. 평점: 5점 만점 기준으로 평가 (예: ⭐4.2/5.0)
2. 한줄평: 식당의 특징과 분위기를 간결하게 한 줄로 작성 (최대 80자)
3. 추천 메뉴: 대표 메뉴 1-2개를 간단히 제시

응답 형식:
평점: ⭐X.X/5.0
한줄평: [한 줄 요약]
추천 메뉴: [메뉴명]

예시:
평점: ⭐4.3/5.0
한줄평: 신선한 재료와 정성스러운 요리로 유명한 곳으로, 분위기 좋은 데이트 코스로 추천합니다.
추천 메뉴: 특제 스테이크, 시그니처 파스타`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
            maxOutputTokens: 200,
          },
        }),
      }
    );

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
      return data.candidates[0].content.parts[0].text.trim();
    }

    return "";
  } catch (error) {
    console.error("Gemini API 호출 중 오류:", error);
    return "";
  }
}


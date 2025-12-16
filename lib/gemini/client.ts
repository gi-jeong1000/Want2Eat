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
    const prompt = `다음 맛집 정보를 바탕으로 한 줄로 간단하고 매력적인 요약과 평가를 작성해주세요. 
장소명: ${placeName}
주소: ${address}
${category ? `카테고리: ${category}` : ""}

요구사항:
- 한 줄로 작성 (최대 100자)
- 맛집의 특징과 추천 포인트를 간단히 언급
- 친근하고 긍정적인 톤으로 작성
- 이모지나 특수문자 사용 금지

예시 형식: "신선한 재료와 정성스러운 요리로 유명한 곳으로, 분위기 좋은 데이트 코스로 추천합니다."`;

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
            maxOutputTokens: 150,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API 오류:", response.status, errorText);
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


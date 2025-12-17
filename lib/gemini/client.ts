/**
 * Google Gemini API 클라이언트
 * 유료 티어 사용
 * 
 * 사용 모델: gemini-2.5-flash (빠르고 효율적인 모델)
 * - 빠른 응답 속도와 비용 효율성
 * - Output Token Limit: 8,192 (간단한 요약에 충분)
 * - Knowledge Cutoff: January 2025 (최신)
 * - 간단한 요약 작업에 최적화
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
    finishReason?: string; // STOP, MAX_TOKENS, SAFETY, RECITATION, 등
    finishMessage?: string;
  }>;
}

/**
 * 블로그 리뷰 기반으로 장소 요약 생성 (할루시네이션 방지)
 */
export async function generatePlaceSummaryFromReviews(
  placeName: string,
  address: string,
  blogData: { titles: string[]; summaries: string[]; combinedText: string },
  category?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("Gemini API 키가 설정되지 않았습니다. AI 요약을 생성할 수 없습니다.");
    return "";
  }

  try {
    const prompt = `아래는 "${placeName}" (${address})에 대해 사람들이 작성한 블로그 검색 결과 요약이다.

${blogData.combinedText}

**중요 지침:**
- 확정적인 사실은 단정하지 말고, 반복적으로 언급되는 메뉴나 특징이 있다면 '언급 경향'으로 정리하라.
- 블로그에서 실제로 언급된 내용만 기반으로 작성하라.
- 블로그에 없는 정보는 추측하지 마라.
- "블로그에서는", "리뷰에서 자주 언급되는", "반복적으로 등장하는" 등의 표현을 사용하라.

**반드시 다음 세 가지 정보를 모두 포함하여 응답해주세요:**

1. 평점: 블로그 리뷰를 종합하여 5점 만점 기준으로 평가 (소수점 첫째 자리까지, 예: 4.2, 4.5, 4.8)
2. 한줄평: 블로그에서 언급되는 메뉴와 특징을 바탕으로 작성 (50-100자, 반드시 완전한 문장)
   - 예: "블로그 리뷰에서 '갈비탕'과 '육개장' 메뉴가 자주 언급되며, '진한 국물'과 '부드러운 고기'라는 표현이 반복적으로 등장합니다. 가성비가 좋다는 평가가 많고, 가족 모임이나 회식 장소로 추천되는 경우가 많습니다."
3. 추천 메뉴: 블로그에서 자주 언급되는 메뉴 1-2개 (반드시 블로그에 언급된 메뉴만, "블로그에서 자주 언급됨" 표시)

**응답 형식 (정확히 이 형식을 따라주세요):**
평점: ⭐X.X/5.0
한줄평: [블로그 리뷰 기반 언급 경향 설명]
추천 메뉴: [메뉴명1, 메뉴명2] (블로그에서 자주 언급됨)

**예시 응답:**
평점: ⭐4.2/5.0
한줄평: 블로그 리뷰에서 "갈비탕"과 "육개장" 메뉴가 자주 언급되며, "진한 국물"과 "부드러운 고기"라는 표현이 반복적으로 등장합니다. 가성비가 좋다는 평가가 많고, 가족 모임이나 회식 장소로 추천되는 경우가 많습니다.
추천 메뉴: 갈비탕, 육개장 (블로그에서 자주 언급됨)

**절대 지켜야 할 규칙:**
1. 블로그에 없는 정보는 작성하지 마라.
2. 확정적인 사실은 단정하지 말고, "언급 경향"으로 표현하라.
3. 반드시 세 가지(평점, 한줄평, 추천 메뉴)를 모두 작성해야 한다.
4. 응답을 중간에 끊지 마라.`;

    // 빠르고 효율적인 Gemini API 모델 사용
    const modelName = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // 타임아웃 설정 (60초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
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
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2000,
          },
        }),
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("❌ Gemini API 요청 타임아웃 (60초 초과)");
        return "";
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API 오류:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return "";
    }

    // 응답 전체를 먼저 텍스트로 읽어서 확인
    const responseText = await response.text();
    let data: GeminiResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ JSON 파싱 실패:", parseError);
      return "";
    }

    if (
      data.candidates &&
      data.candidates[0]?.content?.parts?.[0]?.text
    ) {
      const candidate = data.candidates[0];
      let summary = candidate.content.parts[0].text.trim();
      const finishReason = candidate.finishReason || "UNKNOWN";
      
      const hasRating = summary.includes("평점:");
      const hasReview = summary.includes("한줄평:");
      const hasMenu = summary.includes("추천 메뉴:");
      
      console.log("🔍 Gemini API 응답 검증 (리뷰 기반):", {
        hasRating,
        hasReview,
        hasMenu,
        summaryLength: summary.length,
        finishReason: finishReason,
      });
      
      if (finishReason === "MAX_TOKENS") {
        console.warn("⚠️ 응답이 토큰 제한에 걸렸습니다.");
      } else if (finishReason !== "STOP") {
        console.warn(`⚠️ 응답이 비정상적으로 종료되었습니다. finishReason: ${finishReason}`);
      }
      
      const isComplete = hasRating && hasReview && hasMenu;
      
      if (!isComplete) {
        console.error("❌ Gemini API 응답이 불완전합니다:", {
          hasRating,
          hasReview,
          hasMenu,
          summaryLength: summary.length,
        });
        return summary; // 불완전해도 반환
      }
      
      return summary;
    }

    return "";
  } catch (error) {
    console.error("Gemini API 호출 중 오류:", error);
    return "";
  }
}

/**
 * 기존 함수 (하위 호환성 유지)
 * 블로그 데이터가 없을 때 사용
 */
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

**절대 필수: 반드시 다음 세 가지 정보를 모두 포함하여 응답해주세요. 하나라도 빠지면 안 됩니다. 응답을 중간에 끊지 마세요.**

1. 평점: 5점 만점 기준으로 평가 (소수점 첫째 자리까지, 예: 4.2, 4.5, 4.8)
2. 한줄평: 식당의 특징, 분위기, 추천 포인트를 간결하게 한 줄로 작성 (50-100자, 반드시 완전한 문장으로 작성, 중간에 끊지 마세요)
   - **중요**: 추상적인 표현("맛있는 음식", "좋은 분위기" 등)을 사용하지 마세요.
   - **반드시 구체적인 메뉴명을 포함**하여 설명하세요. 예: "특제 스테이크가 부드럽고 육즙이 풍부한 곳으로, 로맨틱한 분위기의 데이트 코스로 추천합니다."
   - 어떤 메뉴가 왜 좋은지 구체적으로 언급하세요.
3. 추천 메뉴: 대표 메뉴 1-2개를 제시 (반드시 메뉴명을 명확히 작성, "없음"이나 "확인 불가" 같은 답변은 하지 마세요)

**응답 형식 (정확히 이 형식을 따라주세요. 세 줄 모두 필수입니다. 절대 생략하지 마세요. 응답을 중간에 끊지 마세요):**
평점: ⭐X.X/5.0
한줄평: [식당의 특징과 분위기를 간결하게 설명하는 완전한 한 줄 평가 문장]
추천 메뉴: [메뉴명1, 메뉴명2]

**예시 응답 (이 형식을 정확히 따라주세요):**
평점: ⭐4.3/5.0
한줄평: 특제 스테이크가 부드럽고 육즙이 풍부하며, 시그니처 파스타는 알 dente 면발과 진한 크림 소스가 일품인 곳으로, 로맨틱한 분위기의 데이트 코스로 추천합니다.
추천 메뉴: 특제 스테이크, 시그니처 파스타

**중요 규칙 (반드시 지켜주세요):**
1. 평점만 작성하면 안 됩니다. 반드시 세 가지를 모두 작성해야 합니다.
2. 한줄평은 반드시 완전한 문장으로 작성해야 하며, **구체적인 메뉴명을 포함**해야 합니다.
   - 추상적인 표현("맛있는 음식", "좋은 분위기", "훌륭한 서비스" 등)을 사용하지 마세요.
   - 반드시 구체적인 메뉴명을 언급하고, 그 메뉴의 특징을 설명하세요.
   - 예: "갈비탕이 진한 국물과 부드러운 고기로 유명하며, 깔끔한 인테리어의 편안한 분위기로 가족 모임에 좋습니다."
3. 추천 메뉴는 반드시 메뉴명을 명확히 작성해야 합니다. "없음"이나 "확인 불가" 같은 답변은 하지 마세요.
4. 각 항목은 반드시 "평점:", "한줄평:", "추천 메뉴:"로 시작해야 합니다.
5. 응답은 반드시 세 줄로 구성되어야 합니다. 줄바꿈을 정확히 해주세요.
6. 응답을 중간에 끊지 마세요. 반드시 세 가지를 모두 완성해주세요.
7. 토큰 제한이 있어도 세 가지를 모두 작성할 수 있도록 간결하게 작성하되, 완전한 문장으로 작성하세요.`;

    // 빠르고 효율적인 Gemini API 모델 사용 (간단한 요약에 적합)
    const modelName = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // 타임아웃 설정 (60초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey, // 헤더에도 API 키 포함 (권장 방식)
        },
        signal: controller.signal, // 타임아웃 시그널 추가
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
          maxOutputTokens: 2000, // 응답이 잘리는 것을 방지하기 위해 충분히 설정
        },
        }),
      });
      
      clearTimeout(timeoutId); // 성공 시 타임아웃 클리어
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("❌ Gemini API 요청 타임아웃 (60초 초과)");
        return "";
      }
      throw fetchError;
    }

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

    // 응답 전체를 먼저 텍스트로 읽어서 확인
    const responseText = await response.text();
    console.log("🔍 Gemini API 원본 응답 (전체):", {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 500),
      fullResponse: responseText, // 전체 응답 로깅
    });
    
    // JSON 파싱
    let data: GeminiResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ JSON 파싱 실패:", parseError);
      console.error("원본 응답:", responseText);
      return "";
    }

    if (
      data.candidates &&
      data.candidates[0]?.content?.parts?.[0]?.text
    ) {
      const candidate = data.candidates[0];
      let summary = candidate.content.parts[0].text.trim();
      const finishReason = candidate.finishReason || "UNKNOWN";
      const finishMessage = candidate.finishMessage || "";
      
      // 응답에 세 가지 항목이 모두 포함되어 있는지 확인
      const hasRating = summary.includes("평점:");
      const hasReview = summary.includes("한줄평:");
      const hasMenu = summary.includes("추천 메뉴:");
      
      console.log("🔍 Gemini API 응답 검증:", {
        hasRating,
        hasReview,
        hasMenu,
        summaryLength: summary.length,
        finishReason: finishReason,
        finishMessage: finishMessage,
        summaryPreview: summary.substring(0, 300),
        fullSummary: summary, // 전체 요약 로깅
      });
      
      // finishReason 확인
      if (finishReason === "MAX_TOKENS") {
        console.warn("⚠️ 응답이 토큰 제한에 걸렸습니다. maxOutputTokens를 늘려야 합니다.");
      } else if (finishReason !== "STOP") {
        console.warn(`⚠️ 응답이 비정상적으로 종료되었습니다. finishReason: ${finishReason}, finishMessage: ${finishMessage}`);
      }
      
      // 응답이 완전한지 최종 확인
      const isComplete = hasRating && hasReview && hasMenu;
      
      if (!isComplete) {
        console.error("❌ Gemini API 응답이 불완전합니다. 모든 필수 항목이 포함되지 않았습니다:", {
          hasRating,
          hasReview,
          hasMenu,
          summaryLength: summary.length,
          summaryPreview: summary.substring(0, 500),
          fullResponse: summary,
        });
        
        // 불완전한 응답인 경우, 재시도 로직 추가
        // 하지만 무한 루프를 방지하기 위해 한 번만 재시도
        console.log("🔄 불완전한 응답으로 인해 재시도합니다...");
        
        // 재시도 (한 번만)
        try {
          const retryPrompt = prompt + `

**재시도 요청: 이전 응답이 불완전했습니다.**
- 이전 응답이 중간에 잘렸거나 일부 항목이 누락되었습니다.
- 반드시 세 가지(평점, 한줄평, 추천 메뉴)를 모두 포함하여 완전한 응답을 작성해주세요.
- 응답을 중간에 끊지 마세요. 세 줄을 모두 완성해주세요.
- 한줄평은 완전한 문장으로 작성하되, **구체적인 메뉴명을 포함**하여 작성하세요 (50-100자).
- 추상적인 표현("맛있는 음식", "좋은 분위기" 등)을 사용하지 말고, 구체적인 메뉴와 그 특징을 언급하세요.
- 추천 메뉴는 반드시 메뉴명을 명확히 작성하세요.`;

          const retryResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: retryPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2, // 재시도 시 더 낮은 temperature로 일관성 확보
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2000, // 응답이 잘리는 것을 방지하기 위해 충분히 설정
              },
            }),
          });
          
          if (retryResponse.ok) {
            const retryData: GeminiResponse = await retryResponse.json();
            if (retryData.candidates && retryData.candidates[0]?.content?.parts?.[0]?.text) {
              const retrySummary = retryData.candidates[0].content.parts[0].text.trim();
              const retryHasRating = retrySummary.includes("평점:");
              const retryHasReview = retrySummary.includes("한줄평:");
              const retryHasMenu = retrySummary.includes("추천 메뉴:");
              
              if (retryHasRating && retryHasReview && retryHasMenu) {
                console.log("✅ 재시도 성공! 완전한 응답을 받았습니다.");
                return retrySummary;
              } else {
                console.warn("⚠️ 재시도 후에도 응답이 불완전합니다:", {
                  hasRating: retryHasRating,
                  hasReview: retryHasReview,
                  hasMenu: retryHasMenu,
                  summaryPreview: retrySummary.substring(0, 200),
                });
              }
            }
          }
        } catch (retryError) {
          console.error("재시도 중 오류 발생:", retryError);
        }
        
        // 재시도 실패 시 원본 응답 반환 (사용자에게 표시)
        return summary;
      } else {
        console.log("✅ Gemini API 응답이 완전합니다. 모든 필수 항목이 포함되었습니다.");
        return summary;
      }
    }

    return "";
  } catch (error) {
    console.error("Gemini API 호출 중 오류:", error);
    return "";
  }
}


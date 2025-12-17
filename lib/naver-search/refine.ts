/**
 * 네이버 블로그 검색 결과 텍스트 정제
 */

interface NaverBlogItem {
  title: string;
  description: string;
  link: string;
}

export interface RefinedBlogData {
  titles: string[];
  summaries: string[];
  combinedText: string; // Gemini에 전달할 통합 텍스트
}

/**
 * HTML 태그 제거
 */
function removeHtmlTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // HTML 태그 제거
    .replace(/&[^;]+;/g, "") // HTML 엔티티 제거
    .trim();
}

/**
 * 특수문자 정리
 */
function cleanSpecialChars(text: string): string {
  return text
    .replace(/\s+/g, " ") // 연속된 공백을 하나로
    .replace(/[^\w\s가-힣.,!?]/g, "") // 한글, 영문, 숫자, 기본 구두점만 유지
    .trim();
}

/**
 * 중복 제거
 */
function removeDuplicates(texts: string[]): string[] {
  const seen = new Set<string>();
  return texts.filter((text) => {
    const normalized = text.toLowerCase().trim();
    if (seen.has(normalized) || normalized.length < 5) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

/**
 * 텍스트 길이 제한
 */
function limitLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * 네이버 블로그 검색 결과 정제
 */
export function refineBlogData(blogItems: NaverBlogItem[]): RefinedBlogData {
  const titles: string[] = [];
  const summaries: string[] = [];

  for (const item of blogItems) {
    // 제목 정제
    const cleanTitle = cleanSpecialChars(removeHtmlTags(item.title));
    if (cleanTitle.length > 0) {
      titles.push(cleanTitle);
    }

    // 요약 정제
    const cleanDescription = cleanSpecialChars(removeHtmlTags(item.description));
    if (cleanDescription.length > 0) {
      summaries.push(cleanDescription);
    }
  }

  // 중복 제거
  const uniqueTitles = removeDuplicates(titles);
  const uniqueSummaries = removeDuplicates(summaries);

  // Gemini에 전달할 통합 텍스트 생성
  // 각 블로그의 제목과 요약을 조합
  const blogTexts = uniqueTitles.slice(0, 10).map((title, index) => {
    const summary = uniqueSummaries[index] || "";
    return `[블로그 ${index + 1}]\n제목: ${title}\n요약: ${summary}`;
  });

  const combinedText = blogTexts.join("\n\n");
  
  // Gemini 입력 토큰 제한을 고려하여 최대 길이 제한 (약 3000자)
  const limitedCombinedText = limitLength(combinedText, 3000);

  return {
    titles: uniqueTitles.slice(0, 10),
    summaries: uniqueSummaries.slice(0, 10),
    combinedText: limitedCombinedText,
  };
}


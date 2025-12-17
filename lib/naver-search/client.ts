/**
 * 네이버 검색 API 클라이언트
 * 블로그 리뷰 검색용
 */

interface NaverBlogItem {
  title: string;
  description: string;
  link: string;
  bloggername?: string;
  bloggerlink?: string;
  postdate?: string;
}

interface NaverSearchResponse {
  items: NaverBlogItem[];
  total: number;
  start: number;
  display: number;
}

/**
 * 네이버 블로그 검색
 * @param query 검색어 (식당 이름)
 * @param display 가져올 결과 수 (최대 100)
 * @returns 블로그 검색 결과
 */
export async function searchNaverBlogs(
  query: string,
  display: number = 10
): Promise<NaverBlogItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("네이버 API 키가 설정되지 않았습니다. 블로그 검색을 수행할 수 없습니다.");
    return [];
  }

  try {
    const url = `https://openapi.naver.com/v1/search/blog?query=${encodeURIComponent(query)}&display=${Math.min(display, 100)}&sort=sim`;
    
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      console.error("네이버 검색 API 오류:", {
        status: response.status,
        statusText: response.statusText,
      });
      return [];
    }

    const data: NaverSearchResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("네이버 블로그 검색 중 오류:", error);
    return [];
  }
}


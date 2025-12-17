# 네이버 검색 API + Gemini 아키텍처

## 개요
할루시네이션을 줄이고 실제 리뷰 기반 정보를 제공하기 위한 아키텍처

## 전체 흐름

```
[네이버 검색 API]
  ↓
  - 블로그 제목
  - 요약
  - 키워드
  ↓
[텍스트 정제]
  ↓
[Gemini]
  - 언급 메뉴 경향
  - 자주 등장하는 표현
  - 긍/부정 포인트
```

## 1단계: 네이버 검색 API

### API 정보
- **엔드포인트**: `https://openapi.naver.com/v1/search/blog`
- **인증**: Client ID, Client Secret
- **목적**: 식당 이름으로 블로그 리뷰 검색

### 요청 예시
```bash
GET https://openapi.naver.com/v1/search/blog?query=식당이름&display=10&sort=sim
Headers:
  X-Naver-Client-Id: CLIENT_ID
  X-Naver-Client-Secret: CLIENT_SECRET
```

### 응답 구조
```json
{
  "items": [
    {
      "title": "블로그 제목",
      "description": "요약",
      "link": "블로그 URL"
    }
  ]
}
```

## 2단계: 텍스트 정제

### 정제 항목
1. HTML 태그 제거
2. 특수문자 정리
3. 중복 제거
4. 불필요한 공백 제거
5. 요약 텍스트 추출 (최대 길이 제한)

### 정제 후 데이터 구조
```typescript
interface RefinedBlogData {
  titles: string[];      // 블로그 제목들
  summaries: string[];   // 요약 텍스트들
  keywords: string[];    // 추출된 키워드
}
```

## 3단계: Gemini 프롬프트

### ❌ 잘못된 프롬프트
```
"이 식당의 대표 메뉴를 알려줘"
```

### ✅ 올바른 프롬프트
```
아래는 이 식당에 대해 사람들이 작성한 검색 결과 요약이다.

확정적인 사실은 단정하지 말고,
반복적으로 언급되는 메뉴나 특징이 있다면 '언급 경향'으로 정리하라.

출력 예시:
- "블로그에서는 ○○ 메뉴가 자주 언급된다"
- "가성비, 양이 많다는 표현이 반복된다"
- "회식/모임 용도로 언급되는 경우가 많다"
```

## 구현 파일 구조

```
lib/naver-search/
  ├── client.ts          # 네이버 검색 API 클라이언트
  └── refine.ts          # 텍스트 정제 로직

lib/gemini/
  ├── client.ts          # Gemini API 클라이언트 (기존)
  └── review-analyzer.ts # 리뷰 분석 전용 (새로 생성)

app/api/places/
  └── [id]/
      └── analyze-reviews/route.ts  # 리뷰 분석 API
```

## Gemini 출력 형식

### 기존 형식 (할루시네이션 위험)
```
평점: ⭐4.3/5.0
한줄평: 특제 스테이크가 부드럽고 육즙이 풍부하며...
추천 메뉴: 특제 스테이크, 시그니처 파스타
```

### 새로운 형식 (언급 경향 기반)
```
평점: ⭐4.2/5.0
한줄평: 블로그 리뷰에서 "갈비탕"과 "육개장" 메뉴가 자주 언급되며, "진한 국물"과 "부드러운 고기"라는 표현이 반복적으로 등장합니다. 가성비가 좋다는 평가가 많고, 가족 모임이나 회식 장소로 추천되는 경우가 많습니다.
추천 메뉴: 갈비탕, 육개장 (블로그에서 자주 언급됨)
```

## 환경 변수

```env
# 네이버 검색 API
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret

# Gemini API (기존)
GEMINI_API_KEY=your_gemini_key
```

## 비용 고려사항

### 네이버 검색 API
- 무료 티어: 일일 25,000건
- 유료: 건당 요금

### Gemini API
- 기존과 동일
- 리뷰 분석용으로 사용량 증가 가능

## 에러 처리

1. **네이버 검색 API 실패**: 기존 방식으로 폴백
2. **블로그 리뷰 없음**: 기존 방식으로 폴백
3. **Gemini 분석 실패**: 기존 방식으로 폴백


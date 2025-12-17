# Google Places API 사진 연동 구현 계획

## 개요
Google Places API를 사용하여 식당 대표 사진을 가져오는 기능을 구현합니다.
- 지도는 카카오맵 유지
- 사진만 Google Places API에서 가져오기

## API 선택

### 옵션 1: Places API (New) - v1 (권장)
- 최신 API
- RESTful 엔드포인트
- Field Mask를 사용한 효율적인 데이터 요청

### 옵션 2: Places API (Legacy) - REST
- 기존 REST API
- 더 간단한 구조
- 여전히 지원됨

**권장: 옵션 1 (Places API New v1) 사용**

## 구현 단계

### 1단계: Google Cloud 설정
1. Google Cloud Console에서 프로젝트 생성
2. Places API (New) 활성화
3. API 키 발급
4. 환경 변수 설정:
   - `GOOGLE_PLACES_API_KEY`: Google Places API 키

### 2단계: 서버 사이드 API 라우트 생성

#### 2-1. Find Place from Text API
- **엔드포인트**: `POST /places/v1:findPlaceFromText`
- **목적**: 장소 이름과 위치로 `place_id` 찾기
- **요청 예시**:
```json
{
  "input": "장소이름",
  "inputType": "TEXT_QUERY",
  "locationBias": {
    "circle": {
      "center": {
        "latitude": 37.5665,
        "longitude": 126.9780
      },
      "radius": 1000.0
    }
  },
  "fields": ["id", "displayName"]
}
```

#### 2-2. Place Details API
- **엔드포인트**: `GET /places/v1/places/{placeId}`
- **목적**: `place_id`로 상세 정보 가져오기 (photos 포함)
- **Field Mask**: `id,displayName,photos`
- **요청 예시**:
```bash
curl -X GET \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: API_KEY" \
  -H "X-Goog-FieldMask: id,displayName,photos" \
  'https://places.googleapis.com/v1/places/ChIJN1t_tDeuEmsRUsoyG83frY4'
```

#### 2-3. Place Photo API
- **엔드포인트**: `GET /places/v1/places/{placeId}/media/{photoName}`
- **또는**: `GET /places/v1/{photoName}`
- **목적**: `photo_reference`로 실제 사진 URL 생성
- **요청 예시**:
```bash
curl -X GET \
  -H "X-Goog-Api-Key: API_KEY" \
  -H "X-Goog-FieldMask: name,photoUri" \
  'https://places.googleapis.com/v1/places/ChIJN1t_tDeuEmsRUsoyG83frY4/media/photo1'
```

### 3단계: 구현 파일 구조

```
lib/google-places/
  ├── client.ts          # Google Places API 클라이언트
  ├── find-place.ts      # Find Place from Text
  ├── place-details.ts   # Place Details
  └── place-photo.ts     # Place Photo

app/api/google-places/
  └── photo/route.ts     # 사진 가져오기 API 라우트
```

### 4단계: API 라우트 구현

#### `/api/google-places/photo/route.ts`
- **입력**: `placeName`, `latitude`, `longitude`
- **처리**:
  1. Find Place from Text로 `place_id` 찾기
  2. Place Details로 `photos` 배열 가져오기
  3. 첫 번째 사진의 `photo_reference` 사용
  4. Place Photo로 실제 사진 URL 생성
- **출력**: 사진 URL 또는 null

### 5단계: 프론트엔드 통합

#### `app/(main)/places/[id]/page.tsx`
- Google Places 사진 API 호출
- 사진이 있으면 표시, 없으면 기존 플레이스홀더 유지
- 로딩 상태 처리
- 에러 처리 (사진 없음, API 오류 등)

## API 엔드포인트 상세

### Find Place from Text
```
POST https://places.googleapis.com/v1/places:findPlaceFromText
Headers:
  Content-Type: application/json
  X-Goog-Api-Key: YOUR_API_KEY
Body:
{
  "input": "장소이름",
  "inputType": "TEXT_QUERY",
  "locationBias": {
    "circle": {
      "center": {
        "latitude": 37.5665,
        "longitude": 126.9780
      },
      "radius": 1000.0
    }
  },
  "fields": ["id", "displayName"]
}
```

### Place Details
```
GET https://places.googleapis.com/v1/places/{placeId}
Headers:
  X-Goog-Api-Key: YOUR_API_KEY
  X-Goog-FieldMask: id,displayName,photos
```

### Place Photo
```
GET https://places.googleapis.com/v1/{photoName}
Headers:
  X-Goog-Api-Key: YOUR_API_KEY
  X-Goog-FieldMask: name,photoUri
```

또는 직접 URL 생성:
```
https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=800&key=YOUR_API_KEY
```

## 응답 형식

### Find Place from Text 응답
```json
{
  "places": [
    {
      "id": "places/ChIJN1t_tDeuEmsRUsoyG83frY4",
      "displayName": {
        "text": "장소이름",
        "languageCode": "ko"
      }
    }
  ]
}
```

### Place Details 응답 (photos 포함)
```json
{
  "id": "places/ChIJN1t_tDeuEmsRUsoyG83frY4",
  "displayName": {
    "text": "장소이름",
    "languageCode": "ko"
  },
  "photos": [
    {
      "name": "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/photo1",
      "widthPx": 4000,
      "heightPx": 3000,
      "authorAttributions": [
        {
          "displayName": "사진 제공자",
          "uri": "https://maps.google.com/...",
          "photoUri": "https://lh3.googleusercontent.com/..."
        }
      ]
    }
  ]
}
```

### Place Photo 응답
```json
{
  "name": "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/photo1",
  "photoUri": "https://lh3.googleusercontent.com/..."
}
```

## 비용 고려사항

### Google Places API 가격 (2025 기준)
- **Find Place from Text**: SKU당 요금
- **Place Details**: SKU당 요금
- **Place Photo**: SKU당 요금

### 최적화 방안
1. **캐싱**: 같은 장소의 사진은 캐시하여 재사용
2. **필드 마스크**: 필요한 필드만 요청
3. **에러 처리**: 사진이 없으면 기존 플레이스홀더 유지

## 에러 처리

1. **장소를 찾을 수 없음**: 기존 플레이스홀더 유지
2. **사진이 없음**: 기존 플레이스홀더 유지
3. **API 키 오류**: 콘솔 로그 출력, 기존 플레이스홀더 유지
4. **네트워크 오류**: 재시도 또는 기존 플레이스홀더 유지

## 보안 고려사항

1. **API 키**: 서버 사이드에서만 사용 (환경 변수)
2. **Rate Limiting**: API 호출 제한 설정
3. **에러 메시지**: 민감한 정보 노출 방지

## 구현 우선순위

1. ✅ Google Cloud 설정 및 API 키 발급
2. ✅ 서버 사이드 API 라우트 구현
3. ✅ Find Place from Text 구현
4. ✅ Place Details 구현
5. ✅ Place Photo 구현
6. ✅ 프론트엔드 통합
7. ✅ 에러 처리 및 로딩 상태
8. ✅ 캐싱 최적화 (선택사항)

## 참고 문서

- [Places API (New) 공식 문서](https://developers.google.com/maps/documentation/places/web-service)
- [Find Place from Text](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place Photo](https://developers.google.com/maps/documentation/places/web-service/place-photos)


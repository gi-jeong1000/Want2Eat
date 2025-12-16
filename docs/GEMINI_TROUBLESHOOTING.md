# Gemini API 문제 해결 가이드

## "AI 요약을 생성할 수 없습니다" 에러 발생 시 확인사항

### 1. 환경 변수 확인

#### 로컬 개발 환경

`.env.local` 파일에 다음이 있는지 확인:

```env
GEMINI_API_KEY=your_api_key_here
```

#### Vercel 배포 환경

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. `GEMINI_API_KEY`가 있는지 확인
4. 값이 올바른지 확인 (공백이나 따옴표 없이)
5. 환경(Production, Preview, Development) 모두에 설정되어 있는지 확인

### 2. API 키 유효성 확인

#### Google AI Studio에서 확인

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키가 활성화되어 있는지 확인
3. API 키를 복사하여 환경 변수에 정확히 입력했는지 확인

#### API 키 형식

- 올바른 형식: `AIzaSy...` (약 39자)
- 공백이나 줄바꿈이 포함되지 않아야 함
- 따옴표로 감싸지 않아야 함

### 3. 서버 로그 확인

#### 로컬 개발 환경

터미널에서 다음 로그를 확인:

```bash
npm run dev
```

다음과 같은 로그가 나타나는지 확인:

- `Gemini API 호출 시작:`
- `Gemini API 오류:` (에러 발생 시)
- `Gemini API 응답:`

#### Vercel 배포 환경

1. Vercel 대시보드 → 프로젝트 선택
2. Functions 탭 → Logs
3. 최근 로그에서 Gemini API 관련 오류 확인

### 4. 일반적인 오류 원인

#### 1) API 키 미설정

**증상**: `GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.`
**해결**: 환경 변수에 API 키 설정

#### 2) API 키 유효하지 않음

**증상**: `401 Unauthorized` 또는 `403 Forbidden`
**해결**:

- Google AI Studio에서 새 API 키 생성
- 환경 변수에 올바른 키 입력

#### 3) 요청 한도 초과

**증상**: `429 Too Many Requests`
**해결**:

- 무료 티어 제한: 15 RPM, 1500 RPD
- 잠시 후 다시 시도

#### 4) 잘못된 요청 형식

**증상**: `400 Bad Request`
**해결**:

- 서버 로그에서 상세한 에러 메시지 확인
- Gemini API 문서 확인

### 5. 디버깅 방법

#### 환경 변수 확인 (로컬)

```bash
# Windows PowerShell
echo $env:GEMINI_API_KEY

# Windows CMD
echo %GEMINI_API_KEY%

# Linux/Mac
echo $GEMINI_API_KEY
```

#### API 키 테스트

브라우저 콘솔에서 직접 테스트:

```javascript
fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "안녕하세요" }] }],
    }),
  }
)
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

### 6. 체크리스트

- [ ] `.env.local`에 `GEMINI_API_KEY` 설정됨
- [ ] Vercel 환경 변수에 `GEMINI_API_KEY` 설정됨
- [ ] API 키가 유효함 (Google AI Studio에서 확인)
- [ ] API 키에 공백이나 따옴표 없음
- [ ] 서버 재시작 후에도 환경 변수 적용됨
- [ ] 일일/분당 요청 한도 초과하지 않음
- [ ] 서버 로그에서 상세한 에러 메시지 확인

### 7. 여전히 문제가 발생하는 경우

1. **서버 로그 확인**: 가장 중요한 단계입니다. 실제 에러 메시지를 확인하세요.
2. **API 키 재생성**: Google AI Studio에서 새 API 키를 생성하고 다시 시도
3. **환경 변수 재설정**: Vercel에서 환경 변수를 삭제하고 다시 추가
4. **서버 재배포**: 환경 변수 변경 후 Vercel에서 재배포 필요

### 8. 로그 예시

#### 성공적인 호출

```
Gemini API 호출 시작: { placeName: '맛있는 식당', address: '서울시...', category: '한식', apiKeyExists: true }
Gemini API 응답: { hasSummary: true, summaryLength: 150 }
```

#### 실패한 호출

```
Gemini API 오류: { status: 401, statusText: 'Unauthorized', error: '...', apiKeyExists: true, apiKeyLength: 39 }
Gemini API 에러 상세: { error: { message: 'API key not valid...' } }
```

이 로그를 통해 정확한 문제를 파악할 수 있습니다.

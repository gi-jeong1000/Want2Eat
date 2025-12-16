# Gemini API 설정 가이드

이 프로젝트는 Google Gemini API를 사용하여 장소 저장 시 자동으로 평가와 요약 정보를 생성합니다.

## 1. Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. Google 계정으로 로그인
3. "Create API Key" 버튼 클릭
4. API 키 복사

## 2. 환경 변수 설정

### 로컬 개발 환경

`.env.local` 파일에 다음을 추가:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Vercel 배포 환경

1. Vercel 대시보드로 이동
2. 프로젝트 선택
3. Settings > Environment Variables
4. `GEMINI_API_KEY` 추가하고 API 키 값 입력
5. Save

## 3. 사용 모델

이 프로젝트는 **gemini-1.5-flash** 모델을 사용합니다:
- 빠른 응답 속도
- 무료 티어 지원
- 텍스트 생성에 최적화

다른 모델을 사용하려면 `lib/gemini/client.ts`에서 `modelName` 변수를 변경하세요:
- `gemini-1.5-flash` (기본값, 추천)
- `gemini-1.5-pro` (더 강력하지만 느림)

## 4. 무료 티어 제한

Gemini API 무료 티어 제한:
- **RPM (Requests Per Minute)**: 15회/분
- **RPD (Requests Per Day)**: 1,500회/일

이 제한을 초과하면 API 호출이 실패할 수 있습니다. 실패 시에도 장소 저장은 정상적으로 진행되며, AI 요약만 생성되지 않습니다.

## 5. 동작 방식

1. 사용자가 장소를 저장하면
2. 서버에서 Gemini API를 호출하여 장소 정보(이름, 주소, 카테고리)를 기반으로 한 줄 요약 생성
3. 생성된 요약을 데이터베이스의 `ai_summary` 필드에 저장
4. 상세 정보 페이지에서 요약 표시

## 6. 문제 해결

### AI 요약이 생성되지 않는 경우

1. 환경 변수 확인: `GEMINI_API_KEY`가 올바르게 설정되었는지 확인
2. API 키 유효성 확인: Google AI Studio에서 API 키가 활성화되어 있는지 확인
3. 무료 티어 제한 확인: 일일/분당 요청 한도를 초과했는지 확인
4. 서버 로그 확인: 콘솔에서 에러 메시지 확인

### API 키 보안

- **절대** API 키를 Git에 커밋하지 마세요
- `.env.local`은 `.gitignore`에 포함되어 있어야 합니다
- Vercel 환경 변수는 암호화되어 저장됩니다


-- places 테이블에 AI 요약 필드 추가
ALTER TABLE places ADD COLUMN IF NOT EXISTS ai_summary TEXT;


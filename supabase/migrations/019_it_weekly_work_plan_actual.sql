-- daily_entries JSON 구조 (애플리케이션 레벨)
-- {
--   "2026-06-23": {
--     "plan": "계획 내용",
--     "actual": "실적 내용",
--     "overtime": true
--   }
-- }
-- 기존 문자열 형식 값은 실적으로 자동 변환됩니다.

NOTIFY pgrst, 'reload schema';

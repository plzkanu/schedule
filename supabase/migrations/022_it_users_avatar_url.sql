-- 사용자 프로필 이미지

ALTER TABLE it_users
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Supabase Storage (선택: 대용량 이미지용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

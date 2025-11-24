-- Restore missing profile for user 66033a0b-3540-4ccd-988e-4ddae3057f8c
INSERT INTO public.profiles (id, username, display_name, role, created_at, updated_at)
VALUES (
  '66033a0b-3540-4ccd-988e-4ddae3057f8c',
  'restored_user',
  'Restored User',
  'citizen',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

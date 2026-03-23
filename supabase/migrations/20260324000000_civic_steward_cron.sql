-- Migration: civic_steward_cron
-- Sets up agent_state for civic-steward and a 5-minute cron job to scan posts and chats
-- Fixes agent_proposals to allow 'message' as a subject_type

-- 1. Add "message" to agent_proposals subject_type constraint
ALTER TABLE public.agent_proposals DROP CONSTRAINT IF EXISTS agent_proposals_subject_type_check;
ALTER TABLE public.agent_proposals ADD CONSTRAINT agent_proposals_subject_type_check 
  CHECK (subject_type IN ('user','post','comment','message','project','promise','official'));

-- 2. Add local edge function URL to agent_state (production should override this)
INSERT INTO public.agent_state (agent_name, state_key, state_value, description) 
VALUES (
  'civic-steward', 
  'function_url', 
  '"http://kong:8000/functions/v1/civic-steward"', 
  'URL for civic-steward edge function. Update this in production.'
) ON CONFLICT (agent_name, state_key) DO NOTHING;

-- 3. Ensure pg_cron is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 4. Remove any existing schedule to avoid duplicates
SELECT cron.unschedule('civic-steward-scan')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'civic-steward-scan'
);

-- 5. Schedule civic-steward to run every 5 minutes
-- Scans posts, comments, and chat_messages from the last 1 hour
SELECT cron.schedule(
  'civic-steward-scan',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url       := (SELECT trim(both '"' from state_value::text) FROM public.agent_state WHERE agent_name = 'civic-steward' AND state_key = 'function_url' LIMIT 1),
      headers   := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
      body      := '{"trigger": "cron", "since_hours": 1}'::jsonb
    );
  $$
);

COMMENT ON COLUMN cron.job.jobname IS 'civic-steward-scan: Asynchronously scans posts and chats for AI moderation every 5 minutes';

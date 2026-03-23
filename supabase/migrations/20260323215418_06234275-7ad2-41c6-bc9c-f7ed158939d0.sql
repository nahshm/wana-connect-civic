ALTER TABLE scout_findings ADD COLUMN IF NOT EXISTS cluster_id UUID;
ALTER TABLE scout_findings ADD COLUMN IF NOT EXISTS processor_run_id UUID;
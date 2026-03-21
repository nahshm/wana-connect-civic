-- Add post_id and incident_id to crisis_reports for cross-linking
ALTER TABLE public.crisis_reports 
ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id),
ADD COLUMN IF NOT EXISTS incident_id UUID REFERENCES public.incidents(id);

-- Add archive + audit columns to incidents
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Index for fast crisis dashboard queries
CREATE INDEX IF NOT EXISTS idx_incidents_severity_archived 
ON public.incidents (severity, archived_at) WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crisis_reports_status 
ON public.crisis_reports (status);
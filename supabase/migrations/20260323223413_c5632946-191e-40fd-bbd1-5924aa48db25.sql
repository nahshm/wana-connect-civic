-- Migration 1: Posts table - add auto-generation columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS finding_id UUID REFERENCES public.scout_findings(id);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published_by_agent TEXT;

-- Migration 2: publisher_templates table
CREATE TABLE IF NOT EXISTS public.publisher_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  output_format JSONB DEFAULT '{}',
  example_good TEXT,
  example_bad TEXT,
  requires_review BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.publisher_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage publisher_templates" ON public.publisher_templates
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read publisher_templates" ON public.publisher_templates
  FOR SELECT TO anon USING (true);

-- Migration 3: communities - add publisher_context
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS publisher_context TEXT;

-- Migration 4: scout_findings - add published flag
ALTER TABLE public.scout_findings ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
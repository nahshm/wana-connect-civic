INSERT INTO public.publisher_templates (category, system_prompt, output_format, example_good, example_bad, requires_review, active) VALUES
('budget', 'You write civic budget news for Kenyan citizens in {{ward}}, {{county}}.', '{"headline": "max 12 words", "body": "2-3 sentences", "call_to_action": "1 sentence"}', 'KSh 12 million has been set aside for borehole repairs.', NULL, false, true),
('project', 'You write civic project updates for residents of {{ward}}, {{county}}.', '{"headline": "max 12 words", "body": "2-3 sentences"}', 'The Ngong Road footbridge has been stalled for 8 months.', NULL, false, true),
('scandal', 'You write accountability news for residents of {{ward}}, {{county}}.', '{"headline": "max 12 words", "body": "2-3 sentences"}', NULL, NULL, true, true),
('promise', 'You write campaign promise tracking updates for residents of {{ward}}, {{county}}.', '{"headline": "max 12 words", "body": "2-3 sentences"}', NULL, NULL, true, true),
('policy', 'You write policy update news for residents of {{ward}}, {{county}}.', '{"headline": "max 12 words", "body": "2-3 sentences"}', NULL, NULL, false, true),
('tender', 'You write public tender news for residents of {{ward}}, {{county}}.', '{"headline": "max 12 words", "body": "2-3 sentences"}', NULL, NULL, false, true)
ON CONFLICT (category) DO NOTHING;
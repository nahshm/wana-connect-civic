INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled, category) VALUES
('ai_civic_assistant','AI Civic Assistant','Chat assistant (civic-brain)',false,'ai'),
('ai_civic_router','AI Issue Routing','Auto-routes reported issues to offices (civic-router)',false,'ai'),
('ai_knowledge_ingest','AI Knowledge Ingest','Adds documents to the assistant knowledge base (civic-ingest)',false,'ai'),
('ai_agent_minion','AI Agent: Minion','Background review job (civic-minion)',false,'ai'),
('ai_agent_processor','AI Agent: Processor','Embeds and clusters scout findings (civic-processor)',false,'ai'),
('ai_agent_publisher','AI Agent: Publisher','Auto-writes posts from findings (civic-publisher)',false,'ai'),
('ai_agent_quill','AI Agent: Quill','Summaries and digests (civic-quill)',false,'ai'),
('ai_agent_scout','AI Agent: Scout','News/source scraping (civic-scout)',false,'ai')
ON CONFLICT (feature_key) DO UPDATE SET is_enabled = false, category = 'ai';
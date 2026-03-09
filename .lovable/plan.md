

# SuperAdmin Dashboard: Fresh Redesign

## Current State Assessment

The dashboard is a **2,836-line monolithic file** with 20 sidebar tabs, many of which are:
- **Dead/placeholder**: SecurityTab (static bars), AnalyticsTab ("coming soon"), SystemHealthTab (static green dots), AIInsightsTab (hardcoded fake numbers)
- **Broken**: ModerationQueueTab (disabled with comment "content_flags table does not exist" -- but it DOES exist in the schema)
- **Duplicated**: Officials tab + Position Verification tab do the same thing; Agent Queue + Agent Control Center overlap heavily
- **Fake**: GrokAIAssistant is a mock chatbot that returns canned responses
- **Missing**: No PDF upload for RAG, no agent prompt editing, no agent skills/tools config, no real admin AI assistant

## Redesigned Architecture

### Consolidated Navigation (20 tabs → 7 sections)

```text
1. Overview          ← Dashboard home with real KPIs
2. People            ← Users + Moderators + Officials/Verification (merged)
3. Content           ← Moderation Queue + Anonymous Reports + Crisis (merged)
4. Governance        ← Geographic Data + Institutions (merged)
5. AI Command        ← Agent Queue + Control Center + Civic Intelligence + RAG/Prompts (merged)
6. Platform          ← Feature Flags + Performance + Analytics (merged)
7. System            ← Security + System Health (merged)
```

### File Structure (extracted from monolith)

```text
src/features/admin/
  pages/
    SuperAdminDashboard.tsx          ← Shell: sidebar + content router (~150 lines)
    components/
      OverviewSection.tsx            ← Real stats, recent activity feed, alert banner
      PeopleSection.tsx              ← Sub-tabs: Users | Moderators | Officials & Verification
      ContentSection.tsx             ← Sub-tabs: Moderation Queue (FIXED) | Reports | Crisis
      GovernanceSection.tsx          ← Sub-tabs: Geographic Data | Institutions
      AICommandSection.tsx           ← Sub-tabs: Agent Queue | Drafts | Prompt Studio | Knowledge Base | Agent Config
      PlatformSection.tsx            ← Sub-tabs: Feature Flags | Performance | Analytics
      SystemSection.tsx              ← Security metrics + System Health (combined)
      AdministrativeDivisionManager.tsx  (existing, kept)
      ConstituenciesManager.tsx          (existing, kept)
      CountiesManager.tsx                (existing, kept)
      InstitutionsManager.tsx            (existing, kept)
      WardsManager.tsx                   (existing, kept)
```

### Key Improvements Per Section

**1. Overview** -- Real-time stats from DB (users, reports, agents, flags), recent activity feed combining latest agent runs + proposals + reports. Remove fake "Grok AI" banner.

**2. People** -- Proper user management with search that actually queries DB on submit, role assignment (assign/revoke roles via user_roles table), user detail view. Merge Officials + Position Verification into one sub-tab.

**3. Content** -- Fix ModerationQueueTab to actually query `content_flags` (table exists). Combine with anonymous reports and crisis management.

**4. Governance** -- Merge Geographic Data + Institutions into one section with country selector shared across sub-tabs.

**5. AI Command (God Mode)** -- The major new section:
- **Agent Queue**: Existing proposals + runs + accountability alerts (cleaned up)
- **Draft Review**: All agent drafts (Quill + Sage) in one place
- **Prompt Studio**: Edit system prompts stored in `agent_state` with key like `system_prompt`. View/edit prompt templates for each agent.
- **Knowledge Base**: Existing RAG viewer + **PDF upload** via `react-dropzone` that parses PDF text and inserts into `vectors` table. Bulk document management.
- **Agent Config**: Threshold tuning (existing), agent enable/disable toggles, view agent run history per agent.

**6. Platform** -- Feature flags (existing, works), Performance monitoring (existing component), Analytics placeholder upgraded to show real counts from key tables.

**7. System** -- Combine security metrics (make them real -- query actual RLS status, user counts, etc.) with system health (query edge function status).

### What Gets Removed
- `GrokAIAssistant` -- fake mock chatbot, replaced with nothing (or future real AI assistant)
- `AIInsightsTab` -- hardcoded fake numbers
- Duplicate Officials/Verification logic
- All `console.log` statements (production readiness mandate)
- `as any` casts where proper types exist

### Technical Details

- Each section component is self-contained with its own state and data fetching
- Use `useQuery` consistently (replace raw `useEffect` + `useState` patterns)
- Proper TypeScript types from `src/integrations/supabase/types.ts` instead of `any` casts
- PDF upload in Knowledge Base uses `react-dropzone` (already installed) + a new edge function `civic-ingest` (already exists) or direct text extraction client-side
- Sidebar uses the existing custom sidebar pattern (not ShadCN sidebar, since this is a standalone admin page)

### Implementation Order
1. Create the 7 section components by extracting and cleaning existing code
2. Rewrite `SuperAdminDashboard.tsx` as a thin shell
3. Fix ModerationQueueTab to query `content_flags`
4. Add Prompt Studio sub-tab to AI Command
5. Add PDF upload to Knowledge Base
6. Remove dead code (GrokAI, AIInsights, duplicate tabs)
7. Clean up types and console.logs


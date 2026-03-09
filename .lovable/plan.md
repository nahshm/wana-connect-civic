

# Super Admin Dashboard Improvements

## Issues Identified

**1. People Section — Incomplete User Management**
- No ability to assign/revoke roles (view-only)
- No user detail view or action buttons (ban, suspend, view activity)
- No email/auth info display

**2. Prompt Studio — Empty Because Prompts Are Hardcoded**
- Current design queries `agent_state` for keys containing "prompt" — but all agent prompts are hardcoded as `buildGuardianSystemPrompt()`, `buildMinionSystemPrompt()`, `SYSTEM_PROMPT` constants directly in edge function code
- The Prompt Studio needs to be redesigned: instead of reading from `agent_state`, it should display each agent's system prompt as a known, pre-defined entry that admins can override via `agent_state`
- Agents would then check `agent_state` for a prompt override before falling back to hardcoded defaults

**3. No Agent Directory — Admin has no visibility into what agents exist or what they do**

## Plan

### A. People Section — Complete User Management

Rewrite `PeopleSection.tsx` Users sub-tab:
- Add role assignment: dropdown to assign/revoke roles from the `app_role` enum (`admin`, `moderator`, `official`, `expert`, `journalist`, `citizen`, `super_admin`)
- Add user actions: View profile, suspend (insert warning with severity `temp_ban`), view warnings history
- Show user email (join against auth metadata if available via profiles)
- Add pagination (load more button)
- Expandable user detail row showing: join date, role history, warning count, post count

### B. Prompt Studio — Pre-Populated Agent Registry + Prompt Override System

**Database change**: Seed `agent_state` with one row per agent where `state_key = 'system_prompt'` containing the current hardcoded prompt text. This makes them editable from the dashboard.

**Agent registry**: Define a static registry of all 8 agents in the AICommandSection with their purpose, triggers, and tools:

| Agent | Purpose | Trigger |
|-------|---------|---------|
| **civic-guardian** | Content moderator — scans posts/comments for hate speech, incitement, misinformation | DB webhook on post/comment INSERT + 5min cron |
| **civic-minion** | Decision maker — reviews Guardian proposals, auto-approves high confidence, escalates low confidence to human | 5min cron + manual API |
| **civic-quill** | Bilingual writer — turns agent findings into public-facing messages, warnings, summaries | Event-driven (proposal_approved, new_finding) |
| **civic-scout** | Intelligence collector — scrapes Kenya Gazette, Parliament RSS, news APIs for civic data | Hourly cron |
| **civic-sage** | Policy analyst — RAG analysis of scout findings against legal documents | 6hr cron + scout events |
| **civic-brain** | Civic assistant — powers the user-facing chat with personalized RAG responses | User request (real-time) |
| **civic-steward** | Pre-publish moderator — screens content before posting | User request (real-time) |
| **civic-router** | Government institution lookup — routes civic queries to correct offices | User request (real-time) |
| **civic-ingest** | Document ingestion — chunks and embeds PDFs/text into vectors for RAG | Admin trigger |

**Prompt Studio redesign**:
- Show all 8 agents as cards with purpose description, trigger info, and status
- Each card has an "Edit Prompt" button that opens the agent's system prompt (loaded from `agent_state` if exists, otherwise shows the hardcoded default with a "Save to make editable" action)
- Seed the `agent_state` table with prompt entries via a migration so they show up immediately

**Edge function updates** (for 3 agents with hardcoded prompts): Update `civic-guardian`, `civic-minion`, and `civic-quill` to check `agent_state` for a `system_prompt` key before falling back to their hardcoded prompts. This makes the Prompt Studio functional end-to-end.

### C. Agent Config — Enhanced with Agent Directory

Add an "Agent Directory" card at the top of the Agent Config sub-tab showing all agents with their purpose, last run time (from `agent_runs`), and status.

### Implementation Files

1. **`src/features/admin/pages/components/PeopleSection.tsx`** — Rewrite with role management, user actions, expandable details
2. **`src/features/admin/pages/components/AICommandSection.tsx`** — Rewrite Prompt Studio with agent registry, pre-populated prompts; enhance Agent Config with directory
3. **DB Migration** — Seed `agent_state` with `system_prompt` rows for all agents
4. **`supabase/functions/civic-guardian/index.ts`** — Add `agent_state` prompt override lookup
5. **`supabase/functions/civic-minion/index.ts`** — Add `agent_state` prompt override lookup  
6. **`supabase/functions/civic-quill/index.ts`** — Add `agent_state` prompt override lookup


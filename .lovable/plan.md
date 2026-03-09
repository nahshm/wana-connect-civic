

# Deep Dive: Super Admin Dashboard Gap Analysis

## Platform Overview

Your platform has **146+ database tables** covering: civic engagement, governance, accountability, AI agents, communities, content moderation, projects, promises, officials, and more. The current admin dashboard covers only a fraction of this.

## Current Dashboard Coverage

| Section | Sub-tabs | Status |
|---------|----------|--------|
| **Overview** | KPIs, Activity Feed | ✅ Works — shows counts from 6 tables |
| **People** | Users, Moderators, Officials & Verification | ✅ Position verification IS here (Officials tab) — working |
| **Content** | Moderation Queue, Reports, Crisis | ✅ Works — queries `content_flags`, `anonymous_reports` |
| **Governance** | Geographic Data, Institutions | ✅ Works — full admin for divisions & institutions |
| **AI Command** | Directory, Queue, Drafts, Prompts, Knowledge, Config | ✅ Works — all 9 agents documented |
| **Platform** | Feature Flags, Performance, Analytics | ✅ Works |
| **System** | Security Overview, Health | ⚠️ Static/hardcoded metrics |

**Position Verification Location**: It's in **People → Officials & Verification** tab. The standalone `/admin/verification` route also exists but is redundant.

---

## What's MISSING from the Admin Dashboard

### 1. Community Management (HIGH PRIORITY)
**Tables not surfaced**: `communities`, `community_moderators`, `community_rules`, `community_flairs`, `community_institutions`
- No ability to create/edit/delete communities
- No community settings management (rules, description, visibility)
- No flair management for communities
- No institution linking to communities
- Can view moderators but can't assign them from admin

### 2. Projects & Promises Oversight (HIGH PRIORITY)
**Tables not surfaced**: `government_projects`, `project_updates`, `project_verifications`, `office_promises`, `promise_updates`, `promise_verifications`, `development_promises`, `campaign_promises`
- No admin view of all tracked government projects
- No approval/rejection flow for project submissions
- No promise tracking oversight (can't see all official promises)
- No verification approval for project evidence

### 3. Civic Actions & Issues (MEDIUM)
**Tables not surfaced**: `civic_actions`, `civic_action_updates`, `civic_issues`, `civic_issue_comments`
- No view of citizen-reported issues
- No action coordination dashboard

### 4. NGO & Contractor Management (MEDIUM)
**Tables not surfaced**: `ngo_partners`, `contractors`, `contractor_ratings`
- No NGO partner approval workflow
- No contractor vetting/verification

### 5. CivicClips Moderation (MEDIUM)
**Tables not surfaced**: `civic_clips`, `civic_clip_views`, `civic_clip_variants`
- Short-form video content isn't reviewable from admin

### 6. Gamification & Engagement (LOW)
**Tables not surfaced**: `quests`, `user_quests`, `challenges`, `challenge_submissions`, `badges`, `user_badges`, `leaderboard_scores`
- No quest/challenge management
- No badge award interface
- No leaderboard manipulation

### 7. Real-time Chat/Baraza (LOW)
**Tables not surfaced**: `baraza_spaces`, `chat_rooms`, `chat_messages`
- No visibility into live discussions

### 8. Election Cycles (MEDIUM)
**Tables not surfaced**: `election_cycles`
- No election date management
- No candidate tracking interface

### 9. System Audit & Error Logs (HIGH)
**Tables not surfaced**: `system_audit_log`, `error_logs`, `api_metrics`, `rate_limits`
- System section is all hardcoded "100%" bars
- No real error log viewer
- No API rate limit monitoring

---

## Proposed Dashboard Enhancements

### Phase 1: Critical Gaps
1. **Content → Projects**: Add sub-tab to manage `government_projects` (approve, reject, feature)
2. **Content → Promises**: Add sub-tab to manage `office_promises` and `campaign_promises` verification
3. **People → Community Mods**: Expand Moderators sub-tab to assign mods from admin
4. **System → Audit Logs**: Replace static bars with real `system_audit_log` + `error_logs` viewer

### Phase 2: Accountability Core
5. **Accountability Section** (NEW): Dedicated section with:
   - Projects oversight (all projects, verification queue)
   - Promises tracking (all promises, fulfillment status)
   - Civic Actions (citizen issue reports)
   - Election Cycles manager

### Phase 3: Engagement & Growth
6. **Engagement Section** (NEW):
   - Quests/Challenges manager
   - Badge creator/assigner
   - CivicClips review queue
   - NGO Partner applications

### Phase 4: System Hardening
7. Real API metrics from `api_metrics`
8. Rate limit dashboard from `rate_limits`
9. Error log search from `error_logs`

---

## Implementation Plan

```text
SuperAdminDashboard (7 → 9 sections)
├── Overview          (existing — add more KPIs)
├── People            (existing — expand moderators)
├── Content           (existing — add Projects, Promises sub-tabs)
├── Governance        (existing)
├── AI Command        (existing)
├── Accountability    (NEW — Projects, Promises, Issues, Elections)
├── Engagement        (NEW — Quests, Badges, Clips, NGOs)
├── Platform          (existing)
└── System            (existing — replace static data with real logs)
```

### Estimated Effort
- **Phase 1** (Critical): ~4-5 hours — 4 new sub-tabs
- **Phase 2** (Accountability): ~3-4 hours — new section with 4 sub-tabs
- **Phase 3** (Engagement): ~3-4 hours — new section with 4 sub-tabs
- **Phase 4** (System): ~2 hours — real data queries

**Total**: ~12-15 hours to achieve full platform admin coverage

Ready to proceed?


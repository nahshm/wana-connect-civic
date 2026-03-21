

# Crisis Pipeline: Incidents + Crisis Command Center + Archive (End-to-End)

## Current State

| Component | Status |
|-----------|--------|
| **Report an Incident** (user-facing) | Fully functional — inserts into `incidents` table |
| **Incidents tab** (admin) | Fully functional — search, filter, status management, admin notes, evidence viewing |
| **Crisis Command Center** (admin) | Dead shell — hardcoded "0" counts, no data queries, broadcast button does nothing |
| **`crisis_reports` table** | Exists in DB with full schema but is NEVER queried or written to anywhere in the codebase |
| **Crisis post escalation** | Toast says "escalated to authorities" but no record is created — misleading |
| **Archive flow** | No archive status exists on either incidents or crisis_reports |

## Legal Risks to Address

1. **False claim of authority notification**: CreatePost says "escalated to appropriate authorities" when `sensitivity=crisis` but does nothing. This is legally problematic — users may rely on it and not contact authorities themselves. Must either create a real record or change the language.
2. **No audit trail on crisis actions**: Admin status changes on incidents have no `updated_by` field tracked. For legal defensibility, every crisis action needs an actor recorded.
3. **No data retention compliance on archive**: Archived items must remain queryable for legal holds but hidden from active views.

## Plan

### 1. Database Migration

**Add columns to `crisis_reports`**:
- `post_id UUID REFERENCES posts(id)` — links crisis posts
- `incident_id UUID REFERENCES incidents(id)` — links escalated incidents

**Add `archived_at` and `archived_by` to `incidents`**:
- Enables archive with audit trail (who archived and when)

**Add `updated_by` to `incidents`**:
- Every status change records which admin acted

### 2. Fix CreatePost Crisis Escalation

When `content_sensitivity === 'crisis'`, after post creation:
- Insert a `crisis_reports` row with `post_id`, `crisis_type: 'user_flagged'`, title from the post
- Generate `report_id` using `CR-` prefix + timestamp + random suffix
- Change toast to accurate language: "Your report has been logged in our crisis monitoring system" (no false claims about authority notification)

### 3. Rebuild Crisis Command Center (CrisisSubTab)

Replace the static shell with real queries:
- **Count cards**: Query `crisis_reports` by severity + query `incidents` where `severity IN ('critical','high')` and `archived_at IS NULL`
- **Combined feed**: Merge crisis_reports + critical/high incidents, sorted by created_at
- **Each item**: Shows type badge (Crisis Report / Escalated Incident / Crisis Post), severity, status, title, location, evidence count
- **Actions per item**: Update status (active/investigating/resolved/dismissed), add response actions (timestamped JSON array), archive
- **Broadcast Alert**: Opens a dialog with title, description, severity fields. Inserts into `crisis_reports` with `crisis_type: 'admin_broadcast'`. Toast confirms broadcast was recorded.
- **Escalate Incident**: Button on critical/high incidents to create a linked `crisis_reports` entry

### 4. Archive Flow (Both Incidents and Crisis)

**Incidents**:
- Add "Archive" button (only on resolved/dismissed items)
- Sets `archived_at = now()`, `archived_by = current admin user id`
- Default view filters out `archived_at IS NOT NULL`
- Add "Archived" filter option to see archived items (read-only, no status changes allowed)

**Crisis Reports**:
- Same pattern: status = 'archived', with `resolved_at` and `resolved_by` already exist

### 5. Anonymous Report Escalation

Add "Escalate to Crisis" button on AnonymousReportsSubTab for critical reports. Creates a `crisis_reports` row linked via `anonymous_report_id`.

## Files

| Action | File |
|--------|------|
| MIGRATION | Add `post_id`, `incident_id` to `crisis_reports`; add `archived_at`, `archived_by`, `updated_by` to `incidents` |
| EDIT | `ContentSection.tsx` — Rebuild CrisisSubTab, add archive to IncidentsSubTab, add escalate button to AnonymousReportsSubTab |
| EDIT | `CreatePost.tsx` — Auto-insert `crisis_reports` row on crisis posts with legally accurate language |


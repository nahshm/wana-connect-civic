

# Super Admin Dashboard: Full CRUD & End-to-End Flows

## Investigation Summary

After auditing all admin sections, database schemas, and the position claim wizard, here are the concrete gaps:

### Current State
- **Position Claims**: Users submit via `/claim-position` wizard into `office_holders` table with `verification_status: 'pending'`. Admin can approve/reject in People → Officials tab. **But**: no proof document viewing (URLs not rendered as links), no rejection notes in UI, no ability to revoke/deactivate verified officials, no file viewing.
- **Quests**: Read-only listing. No create, edit, delete, or toggle active/inactive.
- **Badges**: Read-only listing. No create, edit, or delete.
- **Education Content**: No database table exists. No feature at all.
- **Accountability (Projects/Promises)**: Read-only. No create or edit.
- **Content Moderation**: Flags show verdict but not the actual flagged content (no post title/body preview).
- **AI Command**: Fairly complete — has directory, queue, drafts, prompts, knowledge base, and config.

---

## Plan

### 1. Engagement Section — Full CRUD

**Quests Sub-tab** (rewrite `QuestsSubTab`):
- Add "Create Quest" button → inline form with fields: title, description, category, points, difficulty, verification_type, icon, requirements (JSON), is_active
- Each quest card gets Edit and Delete buttons
- Edit opens inline form pre-filled with current values
- Delete with confirmation dialog
- Toggle active/inactive with a switch

**Badges Sub-tab** (rewrite `BadgesSubTab`):
- Add "Create Badge" button → inline form: name, description, icon (emoji picker), category, tier, requirements (JSON), points_reward, is_active
- Each badge card gets Edit and Delete buttons
- Toggle active/inactive

**Education Content Sub-tab** (NEW):
- Create new DB table `education_content` with columns: id, title, description, content (rich text), category, difficulty, author_id (FK profiles), assigned_to (FK profiles, nullable), status (draft/published/archived), is_featured, created_at, updated_at
- Admin can create educational articles directly
- Admin can assign a user as content creator (set `assigned_to`)
- List with filter by status, CRUD operations
- Add as new tab in Engagement section

### 2. Officials & Verification — Complete End-to-End

**Enhance OfficialsSubTab**:
- Show proof documents properly: render `document_url` as clickable link, show `official_email` and `official_website` from `proof_documents` JSON
- Add rejection notes: when rejecting, show a textarea for `rejection_notes` (column already exists in DB)
- Add "Revoke Verification" button for verified officials → sets `verification_status: 'rejected'`, `is_active: false`, clears profile `is_verified`
- Add "Deactivate" button for term-ended officials → sets `is_active: false` without changing verification_status
- Show verification method badge with more detail
- Add expandable row showing full claim details

### 3. Accountability — Full CRUD

**Projects Sub-tab**:
- Add "Create Project" button → form: title, description, status, budget_allocated, institution_id, location
- Each project gets Edit (status, budget, description) and Delete buttons

**Promises Sub-tab**:
- Add "Create Promise" button → form: title, description, status, official (linked to office_holders), deadline
- Each promise gets Edit and Delete

### 4. Content Section — Enhanced Moderation

**Moderation Queue**:
- Join `content_flags` with the actual content: show the flagged post/comment excerpt (need to query the `content_id` + `content_type` to fetch from posts/comments)
- Show who flagged it (reporter profile)
- Add "View Original Content" expandable section

### 5. AI Command — Minor Improvements

- Add "Trigger Agent Run" button per agent in the Directory (invokes edge function)
- Add delete button for knowledge base documents

---

## Database Migration

New table for education content:
```sql
CREATE TABLE public.education_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT DEFAULT 'beginner',
  author_id UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.education_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage education content"
ON public.education_content FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Published education content is public"
ON public.education_content FOR SELECT TO authenticated
USING (status = 'published');
```

## Files to Create/Edit

1. **Migration** — Create `education_content` table
2. **`EngagementSection.tsx`** — Full rewrite: CRUD for quests, badges, + new Education Content tab
3. **`PeopleSection.tsx`** (OfficialsSubTab) — Proof document viewer, rejection notes, revoke/deactivate
4. **`AccountabilitySection.tsx`** — Add create/edit/delete for projects and promises
5. **`ContentSection.tsx`** — Enhanced moderation with content preview
6. **`AICommandSection.tsx`** — Trigger run button, KB delete


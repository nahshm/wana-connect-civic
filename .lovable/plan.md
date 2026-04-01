

# Fix Build Errors

7 errors across 5 files. All are type mismatches — no logic changes needed.

---

## Error 1: `AgentEventType` not assignable to `EventType` (agentUtils.ts:454)

**File**: `supabase/functions/_shared/agentUtils.ts` line 39-49

**Fix**: Expand `EventType` to include all `AgentEventType` values. Replace the `EventType` union with:

```typescript
export type EventType =
  | "violation_detected"
  | "fact_check_requested"
  | "fact_check_complete"
  | "new_finding"
  | "insight_ready"
  | "accountability_alert"
  | "proposal_approved"
  | "proposal_rejected"
  | "draft_ready"
  | "agent_error"
  // AgentEventType values
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "routing_decision"
  | "moderation_flag"
  | "ingest_complete"
  | "fact_check"
  | "issue_cluster"
  | "answer";
```

## Error 2: `subject_type: 'message'` not in ProposalOptions (agentUtils.ts:32)

**File**: `supabase/functions/_shared/agentUtils.ts` line 32

**Fix**: Add `"message"` to the union:
```typescript
subject_type?: "user" | "post" | "comment" | "project" | "promise" | "official" | "message";
```

## Error 3: `row[userColumn]` indexing error (civic-steward:164)

**File**: `supabase/functions/civic-steward/index.ts` line 164

**Fix**: Cast to `any`:
```typescript
subject_id: (row as any)[userColumn],
```

## Error 4: `.catch()` on Postgrest builder (civic-scout:328)

**File**: `supabase/functions/civic-scout/index.ts` line 321-328

**Fix**: Remove `.catch()`, just await and ignore result:
```typescript
await client
  .from("data_sources")
  .update({
    last_scraped: new Date().toISOString(),
    last_scraped_status: "failed",
  })
  .eq("id", source.id);
```

## Error 5: `isLoading` not on AuthContextType (ProtectedRoute:16)

**File**: `src/components/routing/ProtectedRoute.tsx`

**Fix**: Replace all `isLoading` with `loading` (lines 16, 21, 24, 31).

## Error 6: SubmitProjectUpdate type casting (SubmitProjectUpdate:90-96)

**File**: `src/components/projects/SubmitProjectUpdate.tsx` lines 88-96

**Fix**: Add `project_id: projectId` to the insert and remove the broken type cast:
```typescript
const { error } = await supabase
    .from('project_updates')
    .insert({
        project_id: projectId,
        created_by: user.id,
        title,
        description,
        media_urls: photoUrls,
        update_type: updateType
    });
```

## Error 7: `"project-documents"` invalid bucket (SubmitProject:301,334)

**File**: `src/features/accountability/pages/SubmitProject.tsx`

**Fix**: Change the bucket type and usage from `'project-documents'` to `'project-media'` (lines 301, 334). Documents will upload to the same valid bucket.

---

## Summary

| File | Change |
|------|--------|
| `agentUtils.ts` | Expand `EventType` union, add `"message"` to `ProposalOptions` |
| `civic-steward/index.ts` | Cast `row` to `any` for dynamic key access |
| `civic-scout/index.ts` | Remove `.catch()` from Postgrest builder |
| `ProtectedRoute.tsx` | `isLoading` → `loading` |
| `SubmitProjectUpdate.tsx` | Add `project_id`, remove broken type cast |
| `SubmitProject.tsx` | `'project-documents'` → `'project-media'` |


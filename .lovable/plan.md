

# Fix: Agent Trigger Runs + Confirm Moderation Pipeline

## Findings

### Moderation (civic-steward) — CONFIRMED WORKING

Tested the deployed edge function directly:
- **Clean content** → `{ verdict: "APPROVED", confidence: 1.0 }` 
- **Hate speech** → `{ verdict: "BLOCKED", confidence: 0.99, flags: ["Death to all Kikuyus", ...] }` 

The verdict mapping (lines 226-233) is correctly deployed and functional. Frontend UI panels for BLOCKED/NEEDS_REVISION/FLAGGED are all wired at lines 214-233 and 393+ in CreatePostForm.tsx.

### "Trigger Run" Button — ROOT CAUSE OF ERROR

The "Trigger Run" button sends `{ mode: 'manual', triggered_by: 'admin_dashboard' }` to every agent. But:

| Agent | Expected payload | What trigger sends | Result |
|-------|------------------|--------------------|--------|
| civic-steward | `{ trigger: 'cron' }` OR `{ content_type, content }` | `{ mode: 'manual' }` | **400** — "Missing required fields" |
| civic-brain | `{ query, session_id }` | `{ mode: 'manual' }` | Likely error |
| civic-router | `{ issue_description }` | `{ mode: 'manual' }` | Likely error |
| civic-scout | `{ trigger: 'cron' }` | `{ mode: 'manual' }` | Likely error |
| civic-minion | Unknown | `{ mode: 'manual' }` | Unknown |

The button sends a payload none of the agents understand.

## Fix

### Edit: `AICommandSection.tsx` — Agent-specific trigger payloads

Map each agent to its correct trigger payload:

```typescript
const AGENT_TRIGGER_PAYLOADS: Record<string, object> = {
  'civic-steward': { trigger: 'webhook', since_hours: 1 },
  'civic-minion':  { trigger: 'cron' },
  'civic-scout':   { trigger: 'cron' },
  'civic-quill':   { trigger: 'cron' },
  'civic-brain':   {},  // Not triggerable manually (needs query)
  'civic-router':  {},  // Not triggerable manually (needs issue)
  'civic-ingest':  {},  // Not triggerable manually (needs content)
};
```

For agents that can't be manually triggered (brain, router, ingest), disable the button and show "Real-time only" tooltip.

For triggerable agents (steward, minion, scout, quill), send the correct payload.

### Files

| Action | File | What |
|--------|------|------|
| EDIT | `AICommandSection.tsx` | Add per-agent trigger payloads, disable button for non-triggerable agents |

1 file, ~20 lines changed. No migration needed.


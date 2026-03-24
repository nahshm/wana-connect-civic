

# Fix civic-scout End-to-End Pipeline

## Root Cause

civic-scout runs successfully (logs show `items_scanned: 2, items_actioned: 0, status: success`) but produces **zero findings**. The problem is in `fetchFeedItems()`:

1. The configured data sources are **HTML web pages**, not RSS/Atom feeds:
   - `https://parliament.go.ke/the-national-assembly/news-events`
   - `https://parliament.go.ke/matter-articles-...`

2. `fetchFeedItems()` fetches via Jina reader (which returns clean markdown/text), then tries to parse `<item>` or `<entry>` XML blocks using regex. Since the Jina output is markdown, not XML, the regex matches nothing → returns `[]` → scout reports "success" with 0 items.

3. No `JINA_API_KEY` is configured in secrets (only `GROQ_API_KEY`, `LOVABLE_API_KEY`, `OPENAI_API_KEY`), so Jina requests go unauthenticated and may be rate-limited or blocked.

## Fix

### 1. Rewrite `fetchFeedItems()` to handle both RSS feeds and HTML pages

The function should:
- First, try Jina reader to fetch the page content as markdown
- Detect whether the response contains RSS/Atom XML — if yes, parse `<item>`/`<entry>` blocks (existing logic)
- If not XML (i.e., it's a regular web page), use the LLM to extract news items from the markdown. Send the markdown to callLLM with a prompt like: "Extract news article titles, URLs, and summaries from this page. Return JSON array."
- This makes civic-scout work with any URL — RSS feeds, news pages, government portals

### 2. Add fallback: direct fetch before Jina

If Jina fails (no API key, rate limited, timeout), fall back to a direct `fetch()` of the URL and parse the raw HTML for links and headlines. This ensures the pipeline never silently returns 0 items without trying alternatives.

### 3. Better error reporting when 0 items found

Currently scout reports `status: success` even when every source yields 0 items. Add a `warning` status or log a console warning when a source returns 0 feed items, so admins can see something is off.

### 4. Add JINA_API_KEY secret (optional but recommended)

Prompt user to add `JINA_API_KEY` for reliable Jina access. Without it, requests may be throttled.

## Implementation

### Edit: `supabase/functions/civic-scout/index.ts`

Replace `fetchFeedItems()` with a two-strategy approach:

```text
async function fetchFeedItems(url, client):
  1. Fetch via Jina reader (or direct fetch as fallback)
  2. Check if response looks like XML (contains <item> or <entry>)
     → YES: parse RSS/Atom as before
     → NO:  send markdown to callLLM with extraction prompt:
            "Extract news items from this page. Return JSON:
             [{ title, link, summary }]"
            Parse the LLM response with parseLLMJson()
  3. If still 0 items, log warning with URL
  4. Return items
```

### Edit: `scrapeSource()` — improve status reporting

When `items.length === 0` after fetch, set `last_scraped_status: 'partial'` instead of `'success'` and log a warning. This surfaces the problem in the admin UI.

### Deploy civic-scout

After code changes, deploy the updated function.

## Files

| Action | File | What |
|--------|------|------|
| EDIT | `supabase/functions/civic-scout/index.ts` | Rewrite fetchFeedItems with LLM extraction fallback, improve status reporting |
| DEPLOY | `civic-scout` | Push updated function |

Total: 1 file edit + deploy.


/**
 * civic-scout — Intelligence Collection Agent (scrape + classify only)
 *
 * Two modes:
 *   cron: Reads active sources from data_sources table, scrapes each, classifies findings.
 *   fact_check: HTTP POST { promise_id } — fetches news related to a specific promise.
 *
 * Supports both RSS/Atom feeds AND regular HTML pages via LLM extraction fallback.
 *
 * Downstream processing (embedding, clustering, quill triggers) is handled by
 * civic-processor, a separate idempotent cron function.
 */

import {
  agentCorsHeaders,
  jsonResponse,
  sb,
  emitTypedEvent,
  logRun,
} from "../_shared/agentUtils.ts";
import { callLLM, parseLLMJson, truncate } from "../_shared/llmClient.ts";
import type { DataSource } from "../_shared/types.ts";

const AGENT_NAME = "civic-scout";
const JINA_BASE = "https://r.jina.ai/";

// ── Prompts ──────────────────────────────────────────────────────────────────

const RELEVANCE_SYSTEM = `You are a Kenyan civic relevance classifier.
Given a news article title and excerpt, decide if it is relevant to any of these civic topics:
- government budgets, tenders, or procurement
- public appointments or official statements
- legislation, bills, or constitutional matters
- county or national government projects
- corruption investigations or accountability
- public service delivery failures
- parliamentary proceedings

Respond with JSON only:
{ "relevant": true|false, "category": "budget|tender|scandal|promise|policy|official_statement|infrastructure|other", "relevance_score": 0.0-1.0, "summary": "One sentence summary if relevant, else null" }`;

const EXTRACTION_SYSTEM = `You are a web page parser. Extract news article links from the given web page content.
Return a JSON array of objects with these fields:
- title: the article headline
- link: the full URL to the article (must be an absolute URL starting with http)
- summary: a one-sentence summary if available, otherwise null

Only extract actual news/article links, not navigation links, footers, or sidebars.
If no articles are found, return an empty array [].
Return JSON only, no markdown fences.`;

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedItem {
  title: string;
  link: string;
  summary?: string;
  published?: string;
}

// ── Fetch content (Jina with direct fallback) ────────────────────────────────

async function fetchPageContent(url: string): Promise<string> {
  // Strategy 1: Jina reader for clean markdown
  try {
    const jinaKey = Deno.env.get("JINA_API_KEY");
    const headers: Record<string, string> = {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
    };
    if (jinaKey) headers.Authorization = `Bearer ${jinaKey}`;

    const res = await fetch(`${JINA_BASE}${url}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text.length > 100) return text;
    } else {
      console.warn(`[scout] Jina returned ${res.status} for ${url}, falling back to direct fetch`);
      await res.text(); // consume body
    }
  } catch (err) {
    console.warn(`[scout] Jina failed for ${url}: ${err instanceof Error ? err.message : err}`);
  }

  // Strategy 2: Direct fetch
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CivicScout/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
  return await res.text();
}

// ── Parse RSS/Atom XML ───────────────────────────────────────────────────────

function parseRssFeed(text: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemPattern = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
  const matches = text.match(itemPattern) ?? [];

  for (const block of matches.slice(0, 20)) {
    const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const link =
      block.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim() ??
      block.match(/href="([^"]+)"/)?.[1];
    const summary = block
      .match(/<(?:description|summary)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary)>/i)?.[1]
      ?.replace(/<[^>]+>/g, "")
      .trim();
    if (title && link) items.push({ title, link, summary });
  }
  return items;
}

// ── Extract articles from HTML/Markdown via LLM ──────────────────────────────

async function extractArticlesViaLLM(
  content: string,
  sourceUrl: string,
): Promise<FeedItem[]> {
  const trimmed = truncate(content, 3000);

  const response = await callLLM(
    [
      { role: "system", content: EXTRACTION_SYSTEM },
      {
        role: "user",
        content: `Source URL: ${sourceUrl}\n\nPage content:\n${trimmed}`,
      },
    ],
    { maxTokens: 2048, temperature: 0, jsonMode: true },
  );

  const raw = parseLLMJson<FeedItem[] | Record<string, unknown>>(response.content);

  // Handle both flat array and wrapped object (e.g. { "articles": [...] })
  let parsed: FeedItem[];
  if (Array.isArray(raw)) {
    parsed = raw;
  } else if (raw && typeof raw === "object") {
    const firstArray = Object.values(raw).find(Array.isArray) as FeedItem[] | undefined;
    if (firstArray) {
      parsed = firstArray;
    } else {
      console.warn("[scout] LLM extraction returned unexpected shape:", response.content.slice(0, 200));
      return [];
    }
  } else {
    console.warn("[scout] LLM extraction returned non-object:", response.content.slice(0, 200));
    return [];
  }

  // Validate and clean items
  return parsed
    .filter((item) => item.title && item.link && item.link.startsWith("http"))
    .slice(0, 20)
    .map((item) => ({
      title: String(item.title).trim(),
      link: String(item.link).trim(),
      summary: item.summary ? String(item.summary).trim() : undefined,
    }));
}

// ── Unified fetch: RSS → LLM extraction ──────────────────────────────────────

async function fetchFeedItems(url: string): Promise<FeedItem[]> {
  const content = await fetchPageContent(url);

  // Check if it's RSS/Atom XML
  const isXml =
    content.includes("<item>") ||
    content.includes("<item ") ||
    content.includes("<entry>") ||
    content.includes("<entry ") ||
    content.includes("<rss") ||
    content.includes("<feed");

  if (isXml) {
    const rssItems = parseRssFeed(content);
    if (rssItems.length > 0) {
      console.log(`[scout] Parsed ${rssItems.length} RSS/Atom items from ${url}`);
      return rssItems;
    }
  }

  // Not XML or RSS parsing yielded nothing → use LLM extraction
  console.log(`[scout] Using LLM extraction for HTML page: ${url}`);
  const llmItems = await extractArticlesViaLLM(content, url);
  console.log(`[scout] LLM extracted ${llmItems.length} items from ${url}`);
  return llmItems;
}

// ── Classify and store finding ────────────────────────────────────────────────

async function processItem(
  item: FeedItem,
  source: DataSource,
  client: ReturnType<typeof sb>,
): Promise<boolean> {
  const text = `Title: ${item.title}\n\n${item.summary ?? ""}`;

  const response = await callLLM(
    [
      { role: "system", content: RELEVANCE_SYSTEM },
      { role: "user", content: truncate(text, 500) },
    ],
    { maxTokens: 128, temperature: 0, jsonMode: true },
  );

  const result = parseLLMJson<{
    relevant: boolean;
    category: string;
    relevance_score: number;
    summary: string | null;
  }>(response.content);

  if (!result?.relevant || (result.relevance_score ?? 0) < 0.6) return false;

  // Normalize category to match DB check constraint
  const VALID_CATEGORIES = new Set([
    "budget", "tender", "scandal", "promise", "policy",
    "official_statement", "infrastructure", "other",
  ]);
  const normalizedCategory = VALID_CATEGORIES.has(result.category)
    ? result.category
    : "other";

  const { error } = await client.from("scout_findings").insert({
    source_url: item.link,
    source_type:
      source.type === "parliament"
        ? "hansard"
        : source.type === "gov_portal"
          ? "gazette"
          : "news",
    title: item.title,
    summary: result.summary ?? item.summary?.slice(0, 500),
    raw_content: text.slice(0, 2000),
    relevance_score: result.relevance_score,
    category: normalizedCategory,
    embedded: false,
    processed: false,
  });

  if (error) {
    if (!error.message.includes("duplicate") && !error.message.includes("unique")) {
      console.error("Insert finding error:", error.message);
    }
    return false;
  }

  return true;
}

// ── Scrape one source ─────────────────────────────────────────────────────────

async function scrapeSource(
  source: DataSource,
  client: ReturnType<typeof sb>,
): Promise<{ stored: number; itemsFound: number; error?: string }> {
  let stored = 0;
  let itemsFound = 0;
  let scrapeError: string | undefined;

  try {
    const items = await fetchFeedItems(source.url);
    itemsFound = items.length;

    if (items.length === 0) {
      console.warn(`[scout] WARNING: 0 items found for source "${source.name}" (${source.url})`);
      await client
        .from("data_sources")
        .update({
          last_scraped: new Date().toISOString(),
          last_scraped_status: "empty",
        })
        .eq("id", source.id);
      return { stored: 0, itemsFound: 0 };
    }

    // Bulk-check for existing URLs before any LLM calls
    const urls = items.map((i) => i.link);
    const { data: existing } = await client
      .from("scout_findings")
      .select("source_url")
      .in("source_url", urls);
    const existingSet = new Set(
      (existing ?? []).map((r: { source_url: string }) => r.source_url),
    );
    const newItems = items.filter((i) => !existingSet.has(i.link));

    console.log(
      `[scout] Source "${source.name}": ${items.length} total, ${existingSet.size} existing, ${newItems.length} new`,
    );

    for (const item of newItems) {
      try {
        const ok = await processItem(item, source, client);
        if (ok) stored++;
      } catch (err) {
        console.error(`Failed to process item ${item.link}:`, err);
      }
    }

    await client
      .from("data_sources")
      .update({
        last_scraped: new Date().toISOString(),
        last_scraped_status: stored > 0 ? "success" : "no_new",
      })
      .eq("id", source.id);
  } catch (err) {
    scrapeError = err instanceof Error ? err.message : String(err);
    console.error(`[scout] Source "${source.name}" failed:`, scrapeError);
    await client
      .from("data_sources")
      .update({
        last_scraped: new Date().toISOString(),
        last_scraped_status: "failed",
      })
      .eq("id", source.id);
  }

  return { stored, itemsFound, error: scrapeError };
}

// ── Fact check mode ───────────────────────────────────────────────────────────

interface OfficialPromise {
  id: string;
  title: string;
  description?: string;
  official_name?: string;
}

async function factCheck(
  promiseId: string,
  client: ReturnType<typeof sb>,
): Promise<{ findings: number }> {
  const { data: promise, error } = await client
    .from("official_promises")
    .select("id, title, description, official_name")
    .eq("id", promiseId)
    .single();

  if (error || !promise) throw new Error(`Promise ${promiseId} not found`);
  const p = promise as OfficialPromise;

  const query = `${p.title} Kenya government`;
  const newsKey = Deno.env.get("NEWSDATA_API_KEY");

  if (!newsKey) throw new Error("NEWSDATA_API_KEY not set");

  const newsdataUrl = `https://newsdata.io/api/1/news?apikey=${newsKey}&q=${encodeURIComponent(query)}&country=ke&language=en`;
  const res = await fetch(newsdataUrl, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`NewsData fetch failed: ${res.status}`);

  const json = await res.json();
  const articles = (json.results ?? []).slice(0, 10);
  let findings = 0;

  const fakeSource: DataSource = {
    id: "newsdata",
    name: "NewsData.io",
    url: "https://newsdata.io",
    type: "news",
    active: true,
    scrape_interval_hours: 0,
    created_at: new Date().toISOString(),
  };

  for (const article of articles) {
    try {
      const item: FeedItem = {
        title: article.title,
        link: article.link,
        summary: article.description,
      };
      const ok = await processItem(item, fakeSource, client);
      if (ok) findings++;
    } catch (err) {
      console.error("Fact check item error:", err);
    }
  }

  await emitTypedEvent(client, {
    event_type: "fact_check",
    source_agent: AGENT_NAME,
    payload: { promise_id: promiseId, findings },
  });

  return { findings };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: agentCorsHeaders });
  }

  const startTime = Date.now();
  const client = sb();

  try {
    const body = await req.json().catch(() => ({}));
    const { trigger, promise_id } = body;

    // Fact check mode
    if (promise_id) {
      const result = await factCheck(promise_id, client);
      return jsonResponse({ ok: true, ...result });
    }

    // Cron scrape mode
    const { data: sources, error: srcErr } = await client
      .from("data_sources")
      .select("*")
      .eq("active", true);

    if (srcErr) throw new Error(`Failed to load data_sources: ${srcErr.message}`);
    if (!sources?.length)
      return jsonResponse({ ok: true, message: "No active sources configured." });

    let totalStored = 0;
    let totalFailed = 0;
    let totalItemsFound = 0;

    for (const source of sources as DataSource[]) {
      // Honour scrape_interval_hours — skip recently scraped sources
      if (source.last_scraped) {
        const last = new Date(source.last_scraped).getTime();
        const nextDue = last + source.scrape_interval_hours * 60 * 60 * 1000;
        if (Date.now() < nextDue) continue;
      }

      const { stored, itemsFound, error } = await scrapeSource(source, client);
      totalStored += stored;
      totalItemsFound += itemsFound;
      if (error) totalFailed++;
    }

    await emitTypedEvent(client, {
      event_type: "ingest_complete",
      source_agent: AGENT_NAME,
      payload: {
        sources_scraped: sources.length,
        findings_stored: totalStored,
        items_found: totalItemsFound,
      },
    });

    const status =
      totalFailed >= sources.length
        ? "failed"
        : totalFailed > 0
          ? "partial"
          : "success";

    await logRun(client, AGENT_NAME, {
      trigger_type: trigger === "cron" ? "cron" : "api",
      items_scanned: sources.length,
      items_actioned: totalStored,
      items_failed: totalFailed,
      duration_ms: Date.now() - startTime,
      status,
    });

    return jsonResponse({
      ok: true,
      stored: totalStored,
      sources: sources.length,
      items_found: totalItemsFound,
      status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${AGENT_NAME}] Fatal:`, msg);
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});

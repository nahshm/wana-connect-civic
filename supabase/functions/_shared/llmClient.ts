/**
 * _shared/llmClient.ts
 * Groq → Anthropic waterfall LLM client.
 * All WAAS agents should use callLLM() instead of calling provider SDKs directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: LLMTool[];
  jsonMode?: boolean;
}

export interface LLMResponse {
  content: string;
  provider: 'groq' | 'anthropic';
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// ── Provider configuration ───────────────────────────────────────────────────

interface Provider {
  id: 'groq' | 'anthropic';
  apiKey: string;
  defaultModel: string;
}

/**
 * Returns available LLM providers based on environment variables.
 * Skips any provider whose API key is not set.
 */
export function providers(): Provider[] {
  const result: Provider[] = [];

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (groqKey) {
    result.push({
      id: 'groq',
      apiKey: groqKey,
      defaultModel: 'llama-3.3-70b-versatile',
    });
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    result.push({
      id: 'anthropic',
      apiKey: anthropicKey,
      defaultModel: 'claude-3-5-haiku-20241022',
    });
  }

  return result;
}

// ── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(
  messages: LLMMessage[],
  opts: LLMOptions,
  provider: Provider,
): Promise<LLMResponse> {
  const model = opts.model ?? provider.defaultModel;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.2,
  };

  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw Object.assign(new Error(`Groq error ${res.status}: ${err}`), { status: res.status });
  }

  const json = await res.json();
  return {
    content: json.choices[0]?.message?.content ?? '',
    provider: 'groq',
    model,
    usage: json.usage
      ? {
          prompt_tokens: json.usage.prompt_tokens,
          completion_tokens: json.usage.completion_tokens,
        }
      : undefined,
  };
}

// ── Anthropic call ───────────────────────────────────────────────────────────

async function callAnthropic(
  messages: LLMMessage[],
  opts: LLMOptions,
  provider: Provider,
): Promise<LLMResponse> {
  const model = opts.model ?? provider.defaultModel;

  // Anthropic requires system messages to be top-level, not in the messages array
  const systemMsg = messages.find((m) => m.role === 'system');
  const conversationMsgs = messages.filter((m) => m.role !== 'system');

  const body: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens ?? 1024,
    messages: conversationMsgs,
  };

  if (systemMsg) {
    body.system = systemMsg.content;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw Object.assign(new Error(`Anthropic error ${res.status}: ${err}`), { status: res.status });
  }

  const json = await res.json();
  const content = json.content?.[0]?.text ?? '';

  return {
    content,
    provider: 'anthropic',
    model,
    usage: json.usage
      ? {
          prompt_tokens: json.usage.input_tokens,
          completion_tokens: json.usage.output_tokens,
        }
      : undefined,
  };
}

// ── Waterfall ────────────────────────────────────────────────────────────────

/**
 * Call LLM with automatic Groq → Anthropic waterfall.
 *
 * - Tries Groq first if available.
 * - Falls back to Anthropic on 429 (rate limit) or 503 (unavailable).
 * - Throws if all providers fail or none are configured.
 *
 * @param messages  Chat messages (system/user/assistant)
 * @param opts      Optional model, token, and temperature overrides
 * @returns         LLMResponse with content, provider, and model used
 */
export async function callLLM(
  messages: LLMMessage[],
  opts: LLMOptions = {},
): Promise<LLMResponse> {
  const available = providers();

  if (available.length === 0) {
    throw new Error('No LLM providers configured. Set GROQ_API_KEY or ANTHROPIC_API_KEY.');
  }

  let lastError: Error | null = null;

  for (const provider of available) {
    try {
      if (provider.id === 'groq') {
        return await callGroq(messages, opts, provider);
      } else {
        return await callAnthropic(messages, opts, provider);
      }
    } catch (err) {
      const error = err as Error & { status?: number };
      const isRetryable = error.status === 429 || error.status === 503;

      if (isRetryable) {
        // Fall through to next provider
        lastError = error;
        continue;
      }

      // Non-retryable error — don't try other providers
      throw error;
    }
  }

  throw lastError ?? new Error('All LLM providers failed.');
}

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Truncate text to an approximate token limit.
 * Uses a rough 4-chars-per-token heuristic.
 *
 * @param text       Input text
 * @param maxTokens  Maximum token budget
 * @returns          Truncated string with ellipsis if needed
 */
export function truncate(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
}

/**
 * Parse JSON from an LLM response, stripping markdown fences if present.
 * Returns null on parse failure.
 */
export function parseLLMJson<T = unknown>(raw: string): T | null {
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    return null;
  }
}

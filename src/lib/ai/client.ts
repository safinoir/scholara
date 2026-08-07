/**
 * The only place Scholara talks to a model.
 *
 * Provider-agnostic: any OpenAI-compatible `/chat/completions` endpoint works,
 * so the deployment target (UF NaviGator, OpenAI, a local llama.cpp server)
 * is a config change, not a code change.
 *
 * Hard rules enforced here so callers can't bypass them:
 *   - The key is read from the server environment and never leaves this module.
 *   - Every call is abort-guarded by a timeout.
 *   - Failure is a value (`null`), not an exception, so route handlers always
 *     have somewhere to fall back to.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Ask the provider for a raw JSON object response. */
  json?: boolean;
};

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MODEL = "llama-3.3-70b-instruct";
const DEFAULT_BASE_URL = "https://api.ai.it.ufl.edu";

function apiKey(): string | null {
  const key = process.env.AI_API_KEY ?? process.env.COACH_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

/** Normalizes a base URL to something ending in a version path. */
function chatEndpoint(): string {
  const raw = (
    process.env.AI_BASE_URL ??
    process.env.COACH_BASE_URL ??
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const base = /\/v\d+$/.test(raw) ? raw : `${raw}/v1`;
  return `${base}/chat/completions`;
}

function model(): string {
  return process.env.AI_MODEL ?? process.env.COACH_MODEL ?? DEFAULT_MODEL;
}

/** Whether the AI layer can run at all. Every feature degrades without it. */
export function isAiConfigured(): boolean {
  return apiKey() !== null;
}

/** Returns the assistant's text, or null on any misconfiguration or failure. */
export async function chat(options: ChatOptions): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(chatEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model(),
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 400,
        messages: options.messages,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim().length > 0
      ? content.trim()
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Smaller models wrap JSON in prose or fences even when asked not to, so the
 * outermost brace pair is extracted rather than trusting the response verbatim.
 */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/** Runs a chat call and parses the reply as a JSON object. */
export async function chatJson<T>(
  options: ChatOptions,
  validate: (value: unknown) => T | null,
): Promise<T | null> {
  const text = await chat({ ...options, json: true });
  if (!text) return null;

  const candidate = extractJsonObject(text);
  if (!candidate) return null;

  try {
    return validate(JSON.parse(candidate));
  } catch {
    return null;
  }
}

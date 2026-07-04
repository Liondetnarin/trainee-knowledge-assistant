const AI_TIMEOUT_MS = 30_000;

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiChatResult {
  content: string;
  usage: TokenUsage;
}

export class AiProviderError extends Error {
  readonly status: number;
  readonly provider: string;
  readonly hint: string;

  constructor(message: string, options: { status: number; provider: string; hint: string }) {
    super(message);
    this.name = "AiProviderError";
    this.status = options.status;
    this.provider = options.provider;
    this.hint = options.hint;
  }
}

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ApiErrorBody {
  error?: {
    message?: string;
    code?: number | string;
    metadata?: {
      raw?: string;
      provider_name?: string;
    };
  };
}

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AiProviderError("AI service is not configured. Set AI_API_KEY in .env", {
      status: 503,
      provider: process.env.AI_PROVIDER ?? "openai",
      hint: "Add AI_API_KEY to your .env file and restart the app.",
    });
  }

  return {
    apiKey,
    provider: process.env.AI_PROVIDER ?? "openai",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
  };
}

interface ProviderEndpoint {
  url: string;
  headers: Record<string, string>;
}

/**
 * OpenAI-compatible chat/completions endpoints per provider.
 * Groq and Gemini both expose OpenAI-compatible APIs with generous free tiers.
 */
function getProviderEndpoint(provider: string): ProviderEndpoint {
  switch (provider) {
    case "groq":
      return { url: "https://api.groq.com/openai/v1/chat/completions", headers: {} };
    case "gemini":
      return {
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        headers: {},
      };
    default:
      return { url: "https://api.openai.com/v1/chat/completions", headers: {} };
  }
}

function getErrorHint(message: string, provider: string, model: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("provider returned error")) {
    return `The "${provider}" API could not reach model "${model}". Check AI_MODEL and your account's rate limits/credits, or switch AI_PROVIDER.`;
  }

  if (
    lower.includes("rate") ||
    lower.includes("resourceexhausted") ||
    lower.includes("request limit") ||
    lower.includes("429")
  ) {
    return `Model "${model}" is temporarily overloaded or rate-limited. Wait a few minutes, or switch to a different AI_MODEL/AI_PROVIDER.`;
  }

  if (lower.includes("invalid api key") || lower.includes("unauthorized")) {
    return `Check AI_API_KEY for provider "${provider}" — make sure it matches AI_PROVIDER (e.g. a Groq key for provider=groq).`;
  }

  if (lower.includes("model") && lower.includes("not found")) {
    return `Model "${model}" was not found for provider "${provider}". Check the exact model id in that provider's docs.`;
  }

  if (lower.includes("insufficient") || lower.includes("credit") || lower.includes("balance")) {
    return "Your AI provider account may be out of credits. Top up or switch to a free-tier model.";
  }

  return `Verify AI_PROVIDER, AI_MODEL, and AI_API_KEY in .env, then restart Docker.`;
}

function readContentPart(part: unknown): { type: string; text: string } {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part && typeof part === "object") {
    const block = part as { type?: string; text?: string };
    return {
      type: block.type ?? "text",
      text: String(block.text ?? ""),
    };
  }

  return { type: "text", text: "" };
}

function extractMessageContent(message: Record<string, unknown> | undefined): string {
  if (!message) return "";

  const content = message.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const parts = content.map(readContentPart);
    const answer = parts
      .filter((part) => part.type === "text" || part.type === "output_text")
      .map((part) => part.text)
      .join("")
      .trim();

    if (answer) return answer;

    const fallback = parts
      .map((part) => part.text)
      .join("")
      .trim();
    if (fallback) return fallback;
  }

  if (typeof message.reasoning === "string" && message.reasoning.trim()) {
    return message.reasoning.trim();
  }

  if (typeof message.reasoning_content === "string" && message.reasoning_content.trim()) {
    return message.reasoning_content.trim();
  }

  return "";
}

function parseSsePayload(rawText: string): unknown {
  const chunks: string[] = [];
  let lastObject: unknown;

  for (const line of rawText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: Record<string, unknown>; message?: Record<string, unknown> }>;
    };
    lastObject = parsed;

    const delta = parsed.choices?.[0]?.delta;
    const message = parsed.choices?.[0]?.message;
    const piece = extractMessageContent(delta ?? message);
    if (piece) chunks.push(piece);
  }

  if (chunks.length > 0) {
    return {
      choices: [{ message: { role: "assistant", content: chunks.join("") } }],
      usage: {},
    };
  }

  return lastObject ?? {};
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    throw new Error("empty body");
  }

  const trimmed = rawText.trim();

  if (trimmed.startsWith("data:") || trimmed.includes("\ndata:")) {
    return parseSsePayload(rawText);
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as unknown;
    }
    throw new Error(`not JSON (${trimmed.slice(0, 120)})`);
  }
}

function formatProviderError(
  data: ApiErrorBody,
  status: number,
  provider: string,
  model: string,
): AiProviderError {
  const message = data.error?.message ?? "AI request failed";
  const raw = data.error?.metadata?.raw;
  const providerName = data.error?.metadata?.provider_name;

  const parts = [message];
  if (providerName) parts.push(`upstream: ${providerName}`);
  if (raw) parts.push(raw);

  const fullMessage = `${parts.join(" — ")} (HTTP ${status})`;
  const hint = getErrorHint(message, provider, model);

  return new AiProviderError(fullMessage, { status, provider, hint });
}

async function callChatCompletions(
  messages: AiMessage[],
  model: string,
  apiKey: string,
  apiUrl: string,
  provider: string,
  extraHeaders: Record<string, string> = {},
): Promise<AiChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        stream: false,
        max_tokens: 1536,
      }),
      signal: controller.signal,
    });

    let data: ApiErrorBody & {
      choices?: Array<{ message?: Record<string, unknown> }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    try {
      data = (await parseJsonResponse(response)) as typeof data;
    } catch (parseError) {
      console.error("[ai] failed to parse provider response", {
        provider,
        model,
        status: response.status,
        contentType: response.headers.get("content-type"),
        error: parseError instanceof Error ? parseError.message : parseError,
      });
      throw new AiProviderError(
        `AI returned an unreadable response (HTTP ${response.status})`,
        {
          status: 502,
          provider,
          hint: `Try again, shorten the question, or switch AI_MODEL. Current model: ${model}`,
        },
      );
    }

    if (!response.ok) {
      console.error("[ai] provider error", {
        provider,
        model,
        status: response.status,
        error: data.error,
      });
      throw formatProviderError(data, response.status, provider, model);
    }

    if (data.error?.message) {
      console.error("[ai] provider returned error payload", {
        provider,
        model,
        status: response.status,
        error: data.error,
      });
      throw formatProviderError(data, response.status || 502, provider, model);
    }

    const content = extractMessageContent(data.choices?.[0]?.message);
    if (!content) {
      throw new AiProviderError("AI returned an empty response", {
        status: 502,
        provider,
        hint: "Try again or switch to another AI_MODEL.",
      });
    }

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callAnthropic(
  messages: AiMessage[],
  model: string,
  apiKey: string,
): Promise<AiChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemMessage,
        messages: chatMessages,
      }),
      signal: controller.signal,
    });

    const data = (await response.json()) as ApiErrorBody & {
      content?: Array<{ type?: string; text?: string }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    };

    if (!response.ok) {
      console.error("[ai] anthropic error", { status: response.status, error: data.error });
      throw formatProviderError(data, response.status, "anthropic", model);
    }

    const content = data.content
      ?.map((block) => block.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new AiProviderError("AI returned an empty response", {
        status: 502,
        provider: "anthropic",
        hint: "Try again or switch model.",
      });
    }

    const promptTokens = data.usage?.input_tokens ?? 0;
    const completionTokens = data.usage?.output_tokens ?? 0;

    return {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isTransientProviderError(error: unknown): boolean {
  if (!(error instanceof AiProviderError)) return false;
  const message = error.message.toLowerCase();
  return (
    error.status === 502 &&
    (message.includes("unreadable") || message.includes("empty response"))
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callProvider(
  messages: AiMessage[],
  provider: string,
  model: string,
  apiKey: string,
): Promise<AiChatResult> {
  if (provider === "anthropic") {
    return callAnthropic(messages, model, apiKey);
  }

  const endpoint = getProviderEndpoint(provider);
  return callChatCompletions(
    messages,
    model,
    apiKey,
    endpoint.url,
    provider,
    endpoint.headers,
  );
}

function toProviderError(error: unknown, provider: string, model: string): AiProviderError {
  if (error instanceof AiProviderError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new AiProviderError("AI request timed out. Please try again.", {
      status: 504,
      provider,
      hint: "The model took too long. Try a shorter message or different model.",
    });
  }

  return new AiProviderError(
    error instanceof Error ? error.message : "Failed to reach AI provider",
    {
      status: 502,
      provider,
      hint: getErrorHint("", provider, model),
    },
  );
}

export async function callAiChat(messages: AiMessage[]): Promise<AiChatResult> {
  const { apiKey, provider, model } = getAiConfig();

  try {
    try {
      return await callProvider(messages, provider, model, apiKey);
    } catch (error) {
      if (!isTransientProviderError(error)) throw error;

      console.warn("[ai] transient provider error, retrying once", {
        provider,
        model,
        error: error instanceof Error ? error.message : error,
      });
      await delay(500);
      return await callProvider(messages, provider, model, apiKey);
    }
  } catch (error) {
    throw toProviderError(error, provider, model);
  }
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

async function streamChatCompletions(
  messages: AiMessage[],
  model: string,
  apiKey: string,
  provider: string,
  onDelta: (text: string) => void,
): Promise<AiChatResult> {
  const endpoint = getProviderEndpoint(provider);
  const controller = new AbortController();
  let timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  };

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...endpoint.headers,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: 1536,
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      let data: ApiErrorBody = {};
      try {
        data = (await parseJsonResponse(response)) as ApiErrorBody;
      } catch {
        // fall through with generic error body
      }
      console.error("[ai] stream provider error", {
        provider,
        model,
        status: response.status,
        error: data.error,
      });
      throw formatProviderError(data, response.status || 502, provider, model);
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = "";
    let content = "";
    let reasoningText = "";
    let usage: TokenUsage | null = null;

    // Deltas must keep leading/trailing spaces — do NOT reuse the trimming
    // extractMessageContent here or words get glued together.
    const extractDeltaText = (delta: Record<string, unknown> | undefined): string => {
      if (!delta) return "";
      const deltaContent = delta.content;
      if (typeof deltaContent === "string") return deltaContent;
      if (Array.isArray(deltaContent)) {
        return deltaContent.map((part) => readContentPart(part).text).join("");
      }
      return "";
    };

    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") return;

      let parsed: {
        choices?: Array<{ delta?: Record<string, unknown> }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
        error?: { message?: string };
      };
      try {
        parsed = JSON.parse(payload) as typeof parsed;
      } catch {
        return; // ignore malformed keep-alive chunks
      }

      if (parsed.error?.message) {
        throw formatProviderError(parsed as ApiErrorBody, 502, provider, model);
      }

      if (parsed.usage && typeof parsed.usage.total_tokens === "number") {
        usage = {
          promptTokens: parsed.usage.prompt_tokens ?? 0,
          completionTokens: parsed.usage.completion_tokens ?? 0,
          totalTokens: parsed.usage.total_tokens ?? 0,
        };
      }

      const delta = parsed.choices?.[0]?.delta;
      const piece = extractDeltaText(delta);
      if (piece) {
        content += piece;
        onDelta(piece);
      }

      // Reasoning models may put text here; keep as fallback only.
      if (typeof delta?.reasoning === "string") {
        reasoningText += delta.reasoning;
      } else if (typeof delta?.reasoning_content === "string") {
        reasoningText += delta.reasoning_content;
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      resetTimeout();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        handleLine(line);
      }
    }
    if (buffer) handleLine(buffer);

    if (!content.trim() && reasoningText.trim()) {
      content = reasoningText.trim();
      onDelta(content);
    }

    if (!content.trim()) {
      throw new AiProviderError("AI returned an empty response", {
        status: 502,
        provider,
        hint: "Try again or switch to another model.",
      });
    }

    // Some free models omit usage in streaming — estimate so the token counter keeps working.
    if (!usage) {
      const promptTokens = estimateTokens(messages.map((m) => m.content).join("\n"));
      const completionTokens = estimateTokens(content);
      usage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      };
    }

    return { content, usage };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Streams the assistant reply via onDelta and resolves with the full result.
 * Anthropic falls back to a single non-streamed delta; retries once only if
 * nothing was streamed yet (safe — the client saw no partial output).
 */
export async function callAiChatStream(
  messages: AiMessage[],
  onDelta: (text: string) => void,
): Promise<AiChatResult> {
  const { apiKey, provider, model } = getAiConfig();

  if (provider === "anthropic") {
    const result = await callAiChat(messages);
    onDelta(result.content);
    return result;
  }

  let deltasSent = false;
  const trackDelta = (text: string) => {
    deltasSent = true;
    onDelta(text);
  };

  try {
    try {
      return await streamChatCompletions(messages, model, apiKey, provider, trackDelta);
    } catch (error) {
      if (deltasSent || !isTransientProviderError(error)) throw error;

      console.warn("[ai] transient stream error, retrying once", {
        provider,
        model,
        error: error instanceof Error ? error.message : error,
      });
      await delay(500);
      return await streamChatCompletions(messages, model, apiKey, provider, trackDelta);
    }
  } catch (error) {
    throw toProviderError(error, provider, model);
  }
}

export interface ContextChunk {
  index: number;
  chunk: string;
}

export function buildSystemPrompt(contextChunks: ContextChunk[]): string {
  if (contextChunks.length === 0) {
    return "You are a helpful knowledge assistant. Answer clearly and concisely.";
  }

  const context = contextChunks
    .map(({ index, chunk }) => `[Chunk ${index + 1}]\n${chunk}`)
    .join("\n\n");

  return [
    "You are a helpful knowledge assistant.",
    "Use the document excerpts below to answer the user's question.",
    "If the answer is not in the excerpts, say you cannot find it in the uploaded document.",
    "",
    "Document excerpts:",
    context,
  ].join("\n");
}

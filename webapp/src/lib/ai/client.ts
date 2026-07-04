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

function getErrorHint(message: string, provider: string, model: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("provider returned error")) {
    return `OpenRouter could not reach the model "${model}". Check AI_MODEL at openrouter.ai/models, account credits, and rate limits. Try e.g. openai/gpt-4o-mini or a :free model.`;
  }

  if (
    lower.includes("rate") ||
    lower.includes("resourceexhausted") ||
    lower.includes("request limit") ||
    lower.includes("429")
  ) {
    return `Model "${model}" is temporarily overloaded or rate-limited. Wait a few minutes, or switch AI_MODEL to a paid model like openai/gpt-4o-mini.`;
  }

  if (lower.includes("invalid api key") || lower.includes("unauthorized")) {
    return `Check AI_API_KEY for provider "${provider}". OpenRouter keys start with sk-or-v1-.`;
  }

  if (lower.includes("model") && lower.includes("not found")) {
    return `Model "${model}" was not found. Use a full OpenRouter slug like openai/gpt-4o-mini.`;
  }

  if (lower.includes("insufficient") || lower.includes("credit") || lower.includes("balance")) {
    return "Your AI provider account may be out of credits. Top up or switch to a free model.";
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

  if (provider === "openrouter") {
    return callChatCompletions(
      messages,
      model,
      apiKey,
      "https://openrouter.ai/api/v1/chat/completions",
      "openrouter",
      {
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "Knowledge Assistant",
      },
    );
  }

  return callChatCompletions(
    messages,
    model,
    apiKey,
    "https://api.openai.com/v1/chat/completions",
    "openai",
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
    if (error instanceof AiProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError("AI request timed out. Please try again.", {
        status: 504,
        provider,
        hint: "The model took too long. Try a shorter message or different model.",
      });
    }

    throw new AiProviderError(
      error instanceof Error ? error.message : "Failed to reach AI provider",
      {
        status: 502,
        provider,
        hint: getErrorHint("", provider, model),
      },
    );
  }
}

export function buildSystemPrompt(contextChunks: string[]): string {
  if (contextChunks.length === 0) {
    return "You are a helpful knowledge assistant. Answer clearly and concisely.";
  }

  const context = contextChunks
    .map((chunk, index) => `[Chunk ${index + 1}]\n${chunk}`)
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

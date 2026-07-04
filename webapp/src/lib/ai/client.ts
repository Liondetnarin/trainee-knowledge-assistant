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

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI service is not configured. Set AI_API_KEY in .env");
  }

  return {
    apiKey,
    provider: process.env.AI_PROVIDER ?? "openai",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
  };
}

async function callOpenAi(
  messages: AiMessage[],
  model: string,
  apiKey: string,
): Promise<AiChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    if (!response.ok) {
      throw new Error(data.error?.message ?? "AI request failed");
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("AI returned an empty response");
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

    const data = (await response.json()) as {
      error?: { message?: string };
      content?: Array<{ type?: string; text?: string }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    };

    if (!response.ok) {
      throw new Error(data.error?.message ?? "AI request failed");
    }

    const content = data.content
      ?.map((block) => block.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new Error("AI returned an empty response");
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

export async function callAiChat(messages: AiMessage[]): Promise<AiChatResult> {
  const { apiKey, provider, model } = getAiConfig();

  try {
    if (provider === "anthropic") {
      return await callAnthropic(messages, model, apiKey);
    }

    return await callOpenAi(messages, model, apiKey);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI request timed out. Please try again.");
    }

    throw error;
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

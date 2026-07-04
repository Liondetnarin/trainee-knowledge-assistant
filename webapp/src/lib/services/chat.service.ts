import { randomUUID } from "crypto";
import { retrieveRelevantChunks } from "@/lib/chunking";
import { buildSystemPrompt, callAiChat } from "@/lib/ai/client";
import {
  findDocumentById,
  getChunkTextsByDocumentId,
} from "@/lib/repositories/document.repository";
import {
  createMessage,
  getRecentMessages,
  getSessionTokenTotal,
} from "@/lib/repositories/message.repository";
import type { ChatInput } from "@/lib/validations/chat";

export type ChatResult =
  | {
      success: true;
      reply: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      sessionTotalTokens: number;
      usedDocument: boolean;
    }
  | { success: false; error: string };

export async function chatWithAi(
  input: ChatInput,
  userId: string,
): Promise<ChatResult> {
  let contextChunks: string[] = [];
  let usedDocument = false;

  if (input.documentId) {
    const document = await findDocumentById(input.documentId);

    if (!document || document.userId !== userId) {
      return { success: false, error: "Document not found" };
    }

    const allChunks = await getChunkTextsByDocumentId(input.documentId);
    contextChunks = retrieveRelevantChunks(allChunks, input.message, 5);
    usedDocument = true;
  }

  const recentMessages = await getRecentMessages(userId, 10);
  const aiMessages = [
    { role: "system" as const, content: buildSystemPrompt(contextChunks) },
    ...recentMessages.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
    { role: "user" as const, content: input.message },
  ];

  let aiResult;
  try {
    aiResult = await callAiChat(aiMessages);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get AI response";
    return { success: false, error: message };
  }

  await createMessage({
    id: randomUUID(),
    userId,
    role: "user",
    content: input.message,
    documentId: input.documentId ?? null,
  });

  await createMessage({
    id: randomUUID(),
    userId,
    role: "assistant",
    content: aiResult.content,
    documentId: input.documentId ?? null,
    promptTokens: aiResult.usage.promptTokens,
    completionTokens: aiResult.usage.completionTokens,
    totalTokens: aiResult.usage.totalTokens,
  });

  const sessionTotalTokens = await getSessionTokenTotal(userId);

  return {
    success: true,
    reply: aiResult.content,
    promptTokens: aiResult.usage.promptTokens,
    completionTokens: aiResult.usage.completionTokens,
    totalTokens: aiResult.usage.totalTokens,
    sessionTotalTokens,
    usedDocument,
  };
}

export async function getChatHistory(userId: string) {
  const [messages, sessionTotalTokens] = await Promise.all([
    getRecentMessages(userId, 50),
    getSessionTokenTotal(userId),
  ]);

  return { messages, sessionTotalTokens };
}

import { randomUUID } from "crypto";
import { retrieveRelevantChunks } from "@/lib/chunking";
import {
  buildSystemPrompt,
  callAiChat,
  callAiChatStream,
  AiProviderError,
} from "@/lib/ai/client";
import {
  findDocumentById,
  getChunkTextsByDocumentId,
} from "@/lib/repositories/document.repository";
import {
  createConversation,
  deleteConversation,
  findConversationById,
  findConversationsByUserId,
  renameConversation,
  touchConversation,
} from "@/lib/repositories/conversation.repository";
import {
  createMessage,
  getConversationTokenTotal,
  getRecentMessages,
  getSessionTokenTotal,
} from "@/lib/repositories/message.repository";
import type { ChatInput } from "@/lib/validations/chat";

const NEW_CONVERSATION_TITLE = "New chat";
const TITLE_MAX_LENGTH = 50;

export type ChatResult =
  | {
      success: true;
      reply: string;
      citation: string | null;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      sessionTotalTokens: number;
      conversationTotalTokens: number;
      usedDocument: boolean;
    }
  | { success: false; error: string; hint?: string; status?: number };

function truncateTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  return trimmed.length > TITLE_MAX_LENGTH
    ? `${trimmed.slice(0, TITLE_MAX_LENGTH)}…`
    : trimmed;
}

export async function chatWithAi(
  input: ChatInput,
  userId: string,
  onDelta?: (text: string) => void,
): Promise<ChatResult> {
  const conversation = await findConversationById(input.conversationId);
  if (!conversation || conversation.userId !== userId) {
    return {
      success: false,
      error: "Conversation not found",
      hint: "Start a new chat from the sidebar.",
      status: 404,
    };
  }

  let contextChunks: { index: number; chunk: string }[] = [];
  let usedDocument = false;
  let citation: string | null = null;
  let documentName = "";

  if (input.documentId) {
    const document = await findDocumentById(input.documentId);

    if (!document || document.userId !== userId) {
      return {
        success: false,
        error: "Document not found",
        hint: "Upload a document first or pick another file from the dropdown.",
        status: 404,
      };
    }

    documentName = document.originalName;
    const allChunks = await getChunkTextsByDocumentId(input.documentId);
    contextChunks = retrieveRelevantChunks(allChunks, input.message, 3);
    usedDocument = true;

    if (contextChunks.length > 0) {
      const chunkLabels = contextChunks.map((c) => `#${c.index + 1}`).join(", ");
      citation = `${documentName} (chunk ${chunkLabels})`;
    }
  }

  const recentMessages = await getRecentMessages(input.conversationId, 6);
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
    aiResult = onDelta
      ? await callAiChatStream(aiMessages, onDelta)
      : await callAiChat(aiMessages);
  } catch (error) {
    if (error instanceof AiProviderError) {
      console.error("[chat] AI provider failed", {
        message: error.message,
        provider: error.provider,
        status: error.status,
      });
      return {
        success: false,
        error: error.message,
        hint: error.hint,
        status: error.status,
      };
    }

    const message =
      error instanceof Error ? error.message : "Failed to get AI response";
    console.error("[chat] unexpected AI error", message);
    return { success: false, error: message, status: 502 };
  }

  await createMessage({
    id: randomUUID(),
    userId,
    conversationId: input.conversationId,
    role: "user",
    content: input.message,
    documentId: input.documentId ?? null,
  });

  await createMessage({
    id: randomUUID(),
    userId,
    conversationId: input.conversationId,
    role: "assistant",
    content: aiResult.content,
    documentId: input.documentId ?? null,
    citation,
    promptTokens: aiResult.usage.promptTokens,
    completionTokens: aiResult.usage.completionTokens,
    totalTokens: aiResult.usage.totalTokens,
  });

  await touchConversation(input.conversationId);
  if (conversation.title === NEW_CONVERSATION_TITLE) {
    await renameConversation(input.conversationId, truncateTitle(input.message));
  }

  const [sessionTotalTokens, conversationTotalTokens] = await Promise.all([
    getSessionTokenTotal(userId),
    getConversationTokenTotal(input.conversationId),
  ]);

  return {
    success: true,
    reply: aiResult.content,
    citation,
    promptTokens: aiResult.usage.promptTokens,
    completionTokens: aiResult.usage.completionTokens,
    totalTokens: aiResult.usage.totalTokens,
    sessionTotalTokens,
    conversationTotalTokens,
    usedDocument,
  };
}

export async function listConversations(userId: string) {
  return findConversationsByUserId(userId);
}

export async function startConversation(userId: string, title?: string) {
  return createConversation({
    id: randomUUID(),
    userId,
    title: title?.trim() || NEW_CONVERSATION_TITLE,
  });
}

export type RemoveConversationResult =
  | { success: true }
  | { success: false; error: string; status: number };

export async function removeConversation(
  conversationId: string,
  userId: string,
): Promise<RemoveConversationResult> {
  const conversation = await findConversationById(conversationId);

  if (!conversation || conversation.userId !== userId) {
    return { success: false, error: "Conversation not found", status: 404 };
  }

  await deleteConversation(conversationId);
  return { success: true };
}

export type ConversationHistoryResult =
  | {
      success: true;
      messages: Awaited<ReturnType<typeof getRecentMessages>>;
      sessionTotalTokens: number;
      conversationTotalTokens: number;
    }
  | { success: false; error: string; status: number };

export async function getChatHistory(
  conversationId: string,
  userId: string,
): Promise<ConversationHistoryResult> {
  const conversation = await findConversationById(conversationId);

  if (!conversation || conversation.userId !== userId) {
    return { success: false, error: "Conversation not found", status: 404 };
  }

  const [messages, sessionTotalTokens, conversationTotalTokens] = await Promise.all([
    getRecentMessages(conversationId, 50),
    getSessionTokenTotal(userId),
    getConversationTokenTotal(conversationId),
  ]);

  return { success: true, messages, sessionTotalTokens, conversationTotalTokens };
}

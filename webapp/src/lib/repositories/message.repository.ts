import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";

export type MessageRecord = typeof messages.$inferSelect;

export interface CreateMessageInput {
  id: string;
  userId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  documentId?: string | null;
  citation?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export async function createMessage(
  input: CreateMessageInput,
): Promise<MessageRecord> {
  const db = getDb();
  const record = {
    id: input.id,
    userId: input.userId,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    documentId: input.documentId ?? null,
    citation: input.citation ?? null,
    promptTokens: input.promptTokens ?? 0,
    completionTokens: input.completionTokens ?? 0,
    totalTokens: input.totalTokens ?? 0,
    createdAt: new Date(),
  };

  db.insert(messages).values(record).run();
  return record;
}

export async function getSessionTokenTotal(userId: string): Promise<number> {
  const db = getDb();
  const rows = db
    .select({
      total: sql<number>`coalesce(sum(${messages.totalTokens}), 0)`,
    })
    .from(messages)
    .where(eq(messages.userId, userId))
    .all();

  return Number(rows[0]?.total ?? 0);
}

export async function getConversationTokenTotal(
  conversationId: string,
): Promise<number> {
  const db = getDb();
  const rows = db
    .select({
      total: sql<number>`coalesce(sum(${messages.totalTokens}), 0)`,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .all();

  return Number(rows[0]?.total ?? 0);
}

export async function getRecentMessages(
  conversationId: string,
  limit = 20,
): Promise<MessageRecord[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .all();

  return rows.reverse();
}

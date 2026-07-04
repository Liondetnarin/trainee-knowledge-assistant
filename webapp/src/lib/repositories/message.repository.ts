import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";

export type MessageRecord = typeof messages.$inferSelect;

export interface CreateMessageInput {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  documentId?: string | null;
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
    role: input.role,
    content: input.content,
    documentId: input.documentId ?? null,
    promptTokens: input.promptTokens ?? 0,
    completionTokens: input.completionTokens ?? 0,
    totalTokens: input.totalTokens ?? 0,
    createdAt: new Date(),
  };

  await db.insert(messages).values(record);
  return record;
}

export async function getMessagesByUserId(
  userId: string,
): Promise<MessageRecord[]> {
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(messages.createdAt);
}

export async function getSessionTokenTotal(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${messages.totalTokens}), 0)`,
    })
    .from(messages)
    .where(eq(messages.userId, userId));

  return Number(rows[0]?.total ?? 0);
}

export async function getRecentMessages(
  userId: string,
  limit = 20,
): Promise<MessageRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse();
}

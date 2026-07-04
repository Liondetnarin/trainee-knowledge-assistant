import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";

export type ConversationRecord = typeof conversations.$inferSelect;

export interface CreateConversationInput {
  id: string;
  userId: string;
  title: string;
}

export async function createConversation(
  input: CreateConversationInput,
): Promise<ConversationRecord> {
  const db = getDb();
  const now = new Date();
  const record = { ...input, createdAt: now, updatedAt: now };

  db.insert(conversations).values(record).run();
  return record;
}

export async function findConversationsByUserId(
  userId: string,
): Promise<ConversationRecord[]> {
  const db = getDb();
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .all();
}

export async function findConversationById(
  conversationId: string,
): Promise<ConversationRecord | undefined> {
  const db = getDb();
  const rows = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)
    .all();

  return rows[0];
}

export async function touchConversation(conversationId: string): Promise<void> {
  const db = getDb();
  db.update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))
    .run();
}

export async function renameConversation(
  conversationId: string,
  title: string,
): Promise<void> {
  const db = getDb();
  db.update(conversations).set({ title }).where(eq(conversations.id, conversationId)).run();
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const db = getDb();
  db.delete(messages).where(eq(messages.conversationId, conversationId)).run();
  db.delete(conversations).where(eq(conversations.id, conversationId)).run();
}

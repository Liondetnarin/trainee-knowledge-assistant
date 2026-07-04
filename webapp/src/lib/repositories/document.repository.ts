import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documentChunks, documents } from "@/lib/db/schema";

export type DocumentRecord = typeof documents.$inferSelect;

export interface CreateDocumentInput {
  id: string;
  userId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  filePath: string;
}

export interface ChunkInput {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<DocumentRecord> {
  const db = getDb();
  const record = {
    ...input,
    createdAt: new Date(),
  };

  db.insert(documents).values(record).run();
  return record;
}

export async function saveDocumentChunks(chunks: ChunkInput[]): Promise<void> {
  if (chunks.length === 0) return;

  const db = getDb();
  db.insert(documentChunks).values(chunks).run();
}

export async function findDocumentById(
  documentId: string,
): Promise<DocumentRecord | undefined> {
  const db = getDb();
  const rows = db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1)
    .all();

  return rows[0];
}

export async function findDocumentsByUserId(
  userId: string,
): Promise<DocumentRecord[]> {
  const db = getDb();
  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
    .all();
}

export async function getChunkTextsByDocumentId(
  documentId: string,
): Promise<string[]> {
  const db = getDb();
  const rows = db
    .select({ content: documentChunks.content })
    .from(documentChunks)
    .where(eq(documentChunks.documentId, documentId))
    .orderBy(documentChunks.chunkIndex)
    .all();

  return rows.map((row) => row.content);
}

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import path, { dirname } from "path";
import * as schema from "./schema";
import { seedMockUsers } from "./seed";

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/app.db";
  const relative = url.startsWith("file:") ? url.slice(5) : url;
  return path.isAbsolute(relative)
    ? relative
    : path.join(process.cwd(), relative.replace(/^\.\//, ""));
}

function messagesTableIsPreConversations(sqlite: Database.Database): boolean {
  const tableExists = sqlite
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'messages'`)
    .get();
  if (!tableExists) return false;

  const columns = sqlite.prepare(`PRAGMA table_info(messages)`).all() as Array<{
    name: string;
  }>;
  return !columns.some((column) => column.name === "conversation_id");
}

function initTables(sqlite: Database.Database): void {
  // Older deployments (e.g. a pre-existing Docker volume) may have a
  // "messages" table from before conversations existed — CREATE TABLE IF NOT
  // EXISTS won't add the new NOT NULL column, so drop and let the schema
  // below recreate it. There's no production data to preserve here.
  if (messagesTableIsPreConversations(sqlite)) {
    sqlite.exec(`DROP TABLE IF EXISTS messages;`);
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id),
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      document_id TEXT REFERENCES documents(id),
      citation TEXT,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  `);
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (dbInstance) return dbInstance;

  const dbPath = resolveDbPath();
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  initTables(sqlite);

  dbInstance = drizzle(sqlite, { schema });
  seedMockUsers(dbInstance);

  return dbInstance;
}

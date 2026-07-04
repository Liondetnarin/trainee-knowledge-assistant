import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const MOCK_USERNAME = "admin";
const MOCK_PASSWORD = "admin123";

export function seedAdminUser(db: BetterSQLite3Database<typeof schema>): void {
  const existing = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, MOCK_USERNAME))
    .limit(1)
    .get();

  if (existing) return;

  const passwordHash = bcrypt.hashSync(MOCK_PASSWORD, 10);

  db.insert(schema.users).values({
    id: randomUUID(),
    username: MOCK_USERNAME,
    passwordHash,
    createdAt: new Date(),
  }).run();
}

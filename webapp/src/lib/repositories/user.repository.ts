import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type UserRecord = typeof users.$inferSelect;

export async function findUserByUsername(
  username: string,
): Promise<UserRecord | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return rows[0];
}

export async function findUserById(
  userId: string,
): Promise<UserRecord | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0];
}

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import {
  defaultSession,
  getSessionOptions,
  type SessionData,
} from "@/lib/session";

export async function getSession(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );
  return session;
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    throw new Error("Unauthorized");
  }

  return session;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "Unauthorized";
}

export { defaultSession };

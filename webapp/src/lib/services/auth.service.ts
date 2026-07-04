import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { findUserByUsername } from "@/lib/repositories/user.repository";
import { getSessionOptions, type SessionData } from "@/lib/session";
import type { LoginInput } from "@/lib/validations/auth";

export type AuthResult =
  | { success: true; username: string }
  | { success: false; error: string };

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByUsername(input.username);

  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid username or password" };
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );

  session.userId = user.id;
  session.username = user.username;
  session.isLoggedIn = true;
  await session.save();

  return { success: true, username: user.username };
}

export async function logout(): Promise<void> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );

  session.destroy();
}

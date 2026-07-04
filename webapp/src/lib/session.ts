import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  username: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: "",
  username: "",
  isLoggedIn: false,
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-secret-min-32-chars";
  }

  throw new Error("SESSION_SECRET must be at least 32 characters");
}

let cachedOptions: SessionOptions | null = null;

function useSecureCookies(): boolean {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return appUrl.startsWith("https://");
}

export function getSessionOptions(): SessionOptions {
  if (!cachedOptions) {
    cachedOptions = {
      password: getSessionSecret(),
      cookieName: "knowledge_assistant_session",
      cookieOptions: {
        httpOnly: true,
        // Browsers omit Secure cookies on plain http://localhost unless APP_URL is https.
        secure: useSecureCookies(),
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      },
    };
  }

  return cachedOptions;
}

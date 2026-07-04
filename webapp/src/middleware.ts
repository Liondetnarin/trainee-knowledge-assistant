import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";
import { getSessionOptions, type SessionData } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions(),
  );

  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/chat/:path*", "/upload/:path*"],
};

import { NextRequest, NextResponse } from "next/server";

// TODO: protect routes — redirect to /login if no session
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/upload/:path*"],
};

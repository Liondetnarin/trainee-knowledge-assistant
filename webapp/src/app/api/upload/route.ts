import { NextResponse } from "next/server";

// TODO: implement upload — validate PDF/TXT, sanitize path, extract text, chunk
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet" },
    { status: 501 },
  );
}

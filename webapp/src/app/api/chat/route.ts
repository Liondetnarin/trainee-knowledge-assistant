import { NextResponse } from "next/server";

// TODO: implement chat — AI API + timeout + error handling + token count
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet" },
    { status: 501 },
  );
}

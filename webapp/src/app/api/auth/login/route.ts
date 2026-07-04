import { NextResponse } from "next/server";

// TODO: implement login — bcrypt + iron-session
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet" },
    { status: 501 },
  );
}

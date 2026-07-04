import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireSession,
} from "@/lib/auth/require-session";
import { listConversations, startConversation } from "@/lib/services/chat.service";
import { createConversationSchema } from "@/lib/validations/chat";

export async function GET() {
  try {
    const session = await requireSession();
    const conversations = await listConversations(session.userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to load conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const parsed = createConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const conversation = await startConversation(session.userId, parsed.data.title);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to create conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

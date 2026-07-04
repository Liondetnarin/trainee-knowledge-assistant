import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireSession,
} from "@/lib/auth/require-session";
import { chatWithAi, getChatHistory } from "@/lib/services/chat.service";
import { chatSchema } from "@/lib/validations/chat";

export async function GET() {
  try {
    const session = await requireSession();
    const history = await getChatHistory(session.userId);
    return NextResponse.json(history);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to load chat history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const result = await chatWithAi(parsed.data, session.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      reply: result.reply,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      sessionTotalTokens: result.sessionTotalTokens,
      usedDocument: result.usedDocument,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

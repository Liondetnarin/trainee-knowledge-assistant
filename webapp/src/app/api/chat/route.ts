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
      const issue = parsed.error.issues[0];
      console.warn("[chat] validation failed", parsed.error.issues);
      return NextResponse.json(
        {
          error: issue?.message ?? "Invalid input",
          code: "VALIDATION_ERROR",
          hint: "Check that your message is not empty and document selection is valid.",
        },
        { status: 400 },
      );
    }

    const result = await chatWithAi(parsed.data, session.userId);

    if (!result.success) {
      const status =
        result.status === 400 || result.status === 404 ? result.status : 502;
      console.error("[chat] request failed", {
        status,
        error: result.error,
        hint: result.hint,
      });
      return NextResponse.json(
        {
          error: result.error,
          code: status === 400 || status === 404 ? "CLIENT_ERROR" : "AI_PROVIDER_ERROR",
          hint: result.hint,
        },
        { status },
      );
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

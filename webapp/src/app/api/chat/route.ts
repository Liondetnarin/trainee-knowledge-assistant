import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireSession,
} from "@/lib/auth/require-session";
import { chatWithAi, getChatHistory } from "@/lib/services/chat.service";
import { chatSchema } from "@/lib/validations/chat";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const conversationId = new URL(request.url).searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId query param is required" },
        { status: 400 },
      );
    }

    const history = await getChatHistory(conversationId, session.userId);

    if (!history.success) {
      return NextResponse.json({ error: history.error }, { status: history.status });
    }

    return NextResponse.json({
      messages: history.messages,
      sessionTotalTokens: history.sessionTotalTokens,
      conversationTotalTokens: history.conversationTotalTokens,
    });
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

    const rateLimit = checkRateLimit(`chat:${session.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many messages. Please slow down.",
          code: "RATE_LIMITED",
          hint: `Try again in ${rateLimit.retryAfterSeconds}s.`,
        },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

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

    // Stream the reply as Server-Sent Events so the UI can render tokens live.
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          const result = await chatWithAi(parsed.data, session.userId, (text) =>
            send({ type: "delta", text }),
          );

          if (!result.success) {
            console.error("[chat] request failed", {
              status: result.status,
              error: result.error,
              hint: result.hint,
            });
            send({
              type: "error",
              error: result.error,
              hint: result.hint,
              code:
                result.status === 400 || result.status === 404
                  ? "CLIENT_ERROR"
                  : "AI_PROVIDER_ERROR",
            });
            return;
          }

          send({
            type: "done",
            citation: result.citation,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            totalTokens: result.totalTokens,
            sessionTotalTokens: result.sessionTotalTokens,
            conversationTotalTokens: result.conversationTotalTokens,
            usedDocument: result.usedDocument,
          });
        } catch (error) {
          console.error("[chat] stream failed", error);
          send({
            type: "error",
            error: error instanceof Error ? error.message : "Chat request failed",
            code: "AI_PROVIDER_ERROR",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
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

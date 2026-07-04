import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isUnauthorizedError,
  requireSession,
} from "@/lib/auth/require-session";
import { deleteDocument } from "@/lib/services/upload.service";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const parsed = paramsSchema.safeParse(await params);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    const result = await deleteDocument(parsed.data.id, session.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to delete document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

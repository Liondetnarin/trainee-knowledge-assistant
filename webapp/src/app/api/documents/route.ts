import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireSession,
} from "@/lib/auth/require-session";
import { findDocumentsByUserId } from "@/lib/repositories/document.repository";

export async function GET() {
  try {
    const session = await requireSession();
    const documents = await findDocumentsByUserId(session.userId);

    return NextResponse.json({
      documents: documents.map((doc) => ({
        id: doc.id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to load documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

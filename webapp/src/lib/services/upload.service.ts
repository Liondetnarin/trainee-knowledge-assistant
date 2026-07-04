import { randomUUID } from "crypto";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { splitText } from "@/lib/chunking";
import {
  createDocument,
  saveDocumentChunks,
} from "@/lib/repositories/document.repository";
import { sanitizeFilename } from "@/lib/utils/sanitize-filename";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);

export type UploadResult =
  | {
      success: true;
      document: {
        id: string;
        originalName: string;
        mimeType: string;
        size: number;
        chunkCount: number;
      };
    }
  | { success: false; error: string };

function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR ?? "data/uploads";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function getMaxUploadBytes(): number {
  const maxMb = Number(process.env.UPLOAD_MAX_MB ?? "10");
  return maxMb * 1024 * 1024;
}

function validateFile(file: File): string | null {
  const extension = path.extname(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Only PDF and TXT files are allowed";
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Invalid file type. Only PDF and TXT are allowed";
  }

  if (file.size > getMaxUploadBytes()) {
    return `File exceeds ${process.env.UPLOAD_MAX_MB ?? "10"}MB limit`;
  }

  if (file.size === 0) {
    return "File is empty";
  }

  return null;
}

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export async function uploadDocument(
  file: File,
  userId: string,
): Promise<UploadResult> {
  const validationError = validateFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const uploadDir = getUploadDir();
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const storedName = sanitizeFilename(file.name);
  const filePath = path.join(uploadDir, storedName);
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDir);

  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    return { success: false, error: "Invalid file path" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extractedText: string;
  try {
    extractedText = await extractText(buffer, file.type);
  } catch {
    return { success: false, error: "Failed to extract text from file" };
  }

  if (!extractedText.trim()) {
    return { success: false, error: "No readable text found in file" };
  }

  writeFileSync(filePath, buffer);

  const documentId = randomUUID();
  const chunks = splitText(extractedText);

  await createDocument({
    id: documentId,
    userId,
    originalName: file.name,
    storedName,
    mimeType: file.type,
    size: file.size,
    filePath,
  });

  await saveDocumentChunks(
    chunks.map((content, chunkIndex) => ({
      id: randomUUID(),
      documentId,
      chunkIndex,
      content,
    })),
  );

  return {
    success: true,
    document: {
      id: documentId,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      chunkCount: chunks.length,
    },
  };
}

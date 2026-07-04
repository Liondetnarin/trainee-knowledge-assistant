import { randomUUID } from "crypto";
import path from "path";

const SAFE_NAME = /[^a-zA-Z0-9._-]/g;

export function sanitizeFilename(originalName: string): string {
  const base = path.basename(originalName).replace(SAFE_NAME, "_");
  const trimmed = base.slice(0, 100) || "upload";
  return `${randomUUID()}-${trimmed}`;
}

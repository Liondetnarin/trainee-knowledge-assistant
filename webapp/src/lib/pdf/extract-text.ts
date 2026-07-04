/**
 * Extract text from PDF buffers using pdf-parse v1 (Node-safe, no DOM APIs).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text ?? "";
}

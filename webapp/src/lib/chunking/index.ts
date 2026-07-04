/**
 * Simple text chunking for file context (Phase 1 — no Vector DB)
 * TODO: implement splitText + retrieveRelevantChunks
 */

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 100;

export function splitText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): string[] {
  if (!text.trim()) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}

const SUMMARY_HINT =
  /(?:summarize|summary|สรุป|overview|tl;dr|main points|key points)/i;

export function retrieveRelevantChunks(
  chunks: string[],
  query: string,
  topK = 3,
): string[] {
  if (chunks.length === 0) return [];
  if (SUMMARY_HINT.test(query)) {
    return chunks.slice(0, topK);
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) return chunks.slice(0, topK);

  const scored = chunks.map((chunk, index) => {
    const lower = chunk.toLowerCase();
    const score = terms.reduce(
      (sum, term) => sum + (lower.includes(term) ? 1 : 0),
      0,
    );
    return { index, score, chunk };
  });

  const bestScore = Math.max(...scored.map((entry) => entry.score));
  if (bestScore === 0) {
    return chunks.slice(0, topK);
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk);
}

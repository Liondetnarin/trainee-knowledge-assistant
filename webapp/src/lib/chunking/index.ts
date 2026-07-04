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

export interface RetrievedChunk {
  index: number;
  chunk: string;
}

/**
 * Returns chunk index alongside text so callers can cite which part of the
 * document an answer came from (used for the citation footer in chat).
 */
export function retrieveRelevantChunks(
  chunks: string[],
  query: string,
  topK = 3,
): RetrievedChunk[] {
  if (chunks.length === 0) return [];

  const toResult = (indices: number[]): RetrievedChunk[] =>
    indices.map((index) => ({ index, chunk: chunks[index] }));

  if (SUMMARY_HINT.test(query)) {
    return toResult(chunks.slice(0, topK).map((_, index) => index));
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) {
    return toResult(chunks.slice(0, topK).map((_, index) => index));
  }

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
    return toResult(chunks.slice(0, topK).map((_, index) => index));
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .sort((a, b) => a.index - b.index)
    .map((s) => ({ index: s.index, chunk: s.chunk }));
}

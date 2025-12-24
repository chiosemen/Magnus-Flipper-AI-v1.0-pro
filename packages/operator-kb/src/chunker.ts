/**
 * Text chunking utilities for knowledge base documents
 * Splits text into overlapping chunks for embedding
 */

/**
 * Chunk text into smaller pieces with overlap
 * @param text - Text to chunk
 * @param chunkSize - Target chunk size in tokens (approximate, using 4 chars per token)
 * @param overlap - Overlap size in tokens
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  // Approximate tokens: 4 characters per token
  const chunkSizeChars = chunkSize * 4;
  const overlapChars = overlap * 4;

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSizeChars, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > chunkSizeChars * 0.5) {
        // Only break if we're past halfway point
        chunk = chunk.slice(0, breakPoint + 1);
        start += breakPoint + 1;
      } else {
        start += chunkSizeChars - overlapChars;
      }
    } else {
      start = text.length;
    }

    // Trim whitespace
    chunk = chunk.trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}


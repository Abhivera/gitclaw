import type { CodeChunk, PrFile } from "@/features/reviews/types/review";
import { isSensitiveFile } from "@/features/ai/security";

const MAX_CHUNK_LINES = 80;

function buildChunkId(prNumber: number, filePath: string, part: number) {
  return `pr-${prNumber}--${filePath}--part-${part}`;
}

export function chunkPrFiles(prNumber: number, files: PrFile[]): CodeChunk[] {
  const chunks: CodeChunk[] = [];

  for (const file of files) {
    if (isSensitiveFile(file.filePath)) continue;
    // Preserve whole hunks: splitting at arbitrary lines loses right-side coordinates.
    const hunks = file.patch.split(/(?=^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@)/m);
    let text = "";
    let part = 0;
    const flush = () => {
      if (!text.trim()) return;
      chunks.push({
        id: buildChunkId(prNumber, file.filePath, part++),
        filePath: file.filePath,
        text,
      });
      text = "";
    };
    for (const hunk of hunks) {
      if (text && (text + hunk).split("\n").length > MAX_CHUNK_LINES) flush();
      text += hunk;
    }
    flush();
  }

  return chunks;
}

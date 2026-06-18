import type { PrFile } from "../types/review";

/** Formats PR file patches into a markdown diff section for the review prompt. */
export function formatPrFilesForReview(files: PrFile[]): string {
  return files
    .map(
      (file) => `### ${file.filePath}\n\`\`\`diff\n${file.patch}\n\`\`\``
    )
    .join("\n\n");
}

import type { PrFile } from "../types/review";
import { isSensitiveFile } from "@/features/ai/security";

/** Formats PR file patches into a markdown diff section for the review prompt. */
export function formatPrFilesForReview(files: PrFile[]): string {
  return files
    .filter((file) => !isSensitiveFile(file.filePath))
    .map(
      (file) => `### ${file.filePath}\n\`\`\`diff\n${file.patch}\n\`\`\``
    )
    .join("\n\n");
}

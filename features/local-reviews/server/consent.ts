import { createHash } from "node:crypto";
import type { PrFile } from "@/features/reviews/types/review";

export function snapshotId(folderName: string, files: PrFile[]): string {
  return createHash("sha256").update(JSON.stringify({ folderName, files })).digest("hex");
}

import { minimatch } from "minimatch";
import type { PrFile } from "@/features/reviews/types/review";
import type { GitclawConfig } from "../types/gitclaw-config";

export function shouldIgnorePath(filePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return false;
  }

  return patterns.some((pattern) =>
    minimatch(filePath, pattern, { dot: true, matchBase: true })
  );
}

export function filterFilesByConfig(
  files: PrFile[],
  config: GitclawConfig
): PrFile[] {
  return files.filter(
    (file) => !shouldIgnorePath(file.filePath, config.ignore)
  );
}

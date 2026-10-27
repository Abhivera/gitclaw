import { z } from "zod";

export const localReviewInputSchema = z.object({
  folderName: z.string().min(1).max(255),
  files: z.array(z.object({
    filePath: z.string().min(1).max(1_024).refine((value) =>
      !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes("..")),
    patch: z.string().min(1).max(60_000),
  })).min(1).max(60),
  consent: z.object({ destinationId: z.string().length(64), snapshotId: z.string().length(64), confirmed: z.literal(true) }),
});

export type AiReviewDestination = { id: string; provider: string; endpoint: string; model: string };
export type LocalReviewSelection = {
  id: string;
  folderName: string;
  files: Array<{ filePath: string; lines: number }>;
  totalBytes: number;
  skipped: Array<{ filePath: string; reason: string }>;
  truncated: boolean;
};

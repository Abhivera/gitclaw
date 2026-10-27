import { z } from "zod";

export const reviewFindingSchema = z.object({
  file: z.string().min(1).max(1_024).describe("Path to the changed file"),
  line: z.number().int().positive().describe("Line number in the new file version"),
  severity: z
    .enum(["suggestion", "issue"])
    .describe("suggestion = non-blocking; issue = should fix"),
  body: z.string().min(1).max(8_000).describe("Clear explanation of the finding"),
  suggestion: z
    .string()
    .max(8_000)
    .optional()
    .describe("Suggested code fix, if applicable"),
});

export const structuredReviewSchema = z.object({
  summary: z.string().min(1).max(4_000).describe("One-line overall assessment of the PR"),
  findings: z
    .array(reviewFindingSchema)
    .max(100)
    .describe("Line-level findings; empty array if the diff is clean"),
});

export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
export type StructuredReview = z.infer<typeof structuredReviewSchema>;

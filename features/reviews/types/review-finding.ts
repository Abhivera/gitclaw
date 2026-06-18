import { z } from "zod";

export const reviewFindingSchema = z.object({
  file: z.string().describe("Path to the changed file"),
  line: z.number().int().positive().describe("Line number in the new file version"),
  severity: z
    .enum(["suggestion", "issue"])
    .describe("suggestion = non-blocking; issue = should fix"),
  body: z.string().describe("Clear explanation of the finding"),
  suggestion: z
    .string()
    .optional()
    .describe("Suggested code fix, if applicable"),
});

export const structuredReviewSchema = z.object({
  summary: z.string().describe("One-line overall assessment of the PR"),
  findings: z
    .array(reviewFindingSchema)
    .describe("Line-level findings; empty array if the diff is clean"),
});

export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
export type StructuredReview = z.infer<typeof structuredReviewSchema>;

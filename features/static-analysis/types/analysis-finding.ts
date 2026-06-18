import { z } from "zod";

export const staticAnalysisFindingSchema = z.object({
  tool: z.enum(["eslint", "semgrep", "gitleaks", "npm_audit"]),
  file: z.string(),
  line: z.number().int().positive().optional(),
  severity: z.enum(["issue", "suggestion"]),
  message: z.string(),
});

export type StaticAnalysisFinding = z.infer<typeof staticAnalysisFindingSchema>;

export type StaticAnalysisResult = {
  findings: StaticAnalysisFinding[];
};

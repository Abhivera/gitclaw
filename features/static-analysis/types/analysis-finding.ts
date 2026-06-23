export type StaticAnalysisFinding = {
  tool: "eslint" | "semgrep" | "gitleaks" | "npm_audit";
  file: string;
  line?: number;
  severity: "issue" | "suggestion";
  message: string;
};

export type StaticAnalysisResult = {
  findings: StaticAnalysisFinding[];
};

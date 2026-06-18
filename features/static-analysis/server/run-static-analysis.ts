import type { PrFile } from "@/features/reviews/types/review";
import type { GitclawConfig } from "@/features/config/types/gitclaw-config";
import type {
  StaticAnalysisFinding,
  StaticAnalysisResult,
} from "../types/analysis-finding";

const ESLINT_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  severity: "issue" | "suggestion";
}> = [
  {
    pattern: /console\.(log|debug|info)\(/,
    message: "Avoid console.log in production code",
    severity: "suggestion",
  },
  {
    pattern: /==(?!=)/,
    message: "Use strict equality (===) instead of loose equality (==)",
    severity: "suggestion",
  },
  {
    pattern: /var\s+\w+/,
    message: "Prefer const or let over var",
    severity: "suggestion",
  },
  {
    pattern: /eval\s*\(/,
    message: "eval() is dangerous and should be avoided",
    severity: "issue",
  },
  {
    pattern: /@ts-ignore|@ts-nocheck/,
    message: "TypeScript ignore directives suppress type checking",
    severity: "suggestion",
  },
];

const SEMGREP_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  severity: "issue" | "suggestion";
}> = [
  {
    pattern: /innerHTML\s*=/,
    message: "Direct innerHTML assignment may lead to XSS",
    severity: "issue",
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    message: "dangerouslySetInnerHTML requires careful sanitization",
    severity: "issue",
  },
  {
    pattern: /exec\s*\(\s*[`'"].*\$\{/,
    message: "Command injection risk: shell command with template literal",
    severity: "issue",
  },
  {
    pattern: /new\s+Function\s*\(/,
    message: "Dynamic code execution via Function constructor",
    severity: "issue",
  },
  {
    pattern: /document\.write\s*\(/,
    message: "document.write can enable XSS attacks",
    severity: "issue",
  },
  {
    pattern: /sql\s*\+|`\s*SELECT.*\$\{/i,
    message: "Possible SQL injection via string concatenation",
    severity: "issue",
  },
];

const GITLEAKS_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
}> = [
  {
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}/i,
    message: "Possible API key in diff",
  },
  {
    pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}/i,
    message: "Possible secret or password in diff",
  },
  {
    pattern: /ghp_[a-zA-Z0-9]{36}/,
    message: "GitHub personal access token detected",
  },
  {
    pattern: /sk-[a-zA-Z0-9]{20,}/,
    message: "Possible OpenAI API key detected",
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/,
    message: "AWS access key ID detected",
  },
  {
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
    message: "Private key detected in diff",
  },
];

function lineNumberInPatch(patch: string, matchIndex: number): number {
  const before = patch.slice(0, matchIndex);
  const addedLines = before.split("\n").filter((l) => l.startsWith("+")).length;
  return Math.max(1, addedLines);
}

function scanPatch(
  file: PrFile,
  patterns: Array<{
    pattern: RegExp;
    message: string;
    severity: "issue" | "suggestion";
  }>,
  tool: StaticAnalysisFinding["tool"]
): StaticAnalysisFinding[] {
  const findings: StaticAnalysisFinding[] = [];
  const isJsTs = /\.(tsx?|jsx?|mjs|cjs)$/.test(file.filePath);

  if (!isJsTs && tool === "eslint") {
    return findings;
  }

  for (const { pattern, message, severity } of patterns) {
    const match = pattern.exec(file.patch);
    if (match) {
      findings.push({
        tool,
        file: file.filePath,
        line: lineNumberInPatch(file.patch, match.index),
        severity,
        message,
      });
    }
  }

  return findings;
}

function scanGitleaks(file: PrFile): StaticAnalysisFinding[] {
  const findings: StaticAnalysisFinding[] = [];

  for (const { pattern, message } of GITLEAKS_PATTERNS) {
    const match = pattern.exec(file.patch);
    if (match) {
      findings.push({
        tool: "gitleaks",
        file: file.filePath,
        line: lineNumberInPatch(file.patch, match.index),
        severity: "issue",
        message,
      });
    }
  }

  return findings;
}

function scanNpmAudit(files: PrFile[]): StaticAnalysisFinding[] {
  const findings: StaticAnalysisFinding[] = [];
  const pkgFile = files.find((f) => f.filePath.endsWith("package.json"));

  if (!pkgFile) {
    return findings;
  }

  const addedDeps = pkgFile.patch.match(/^\+\s*"[^"]+"\s*:\s*"[^"]+"/gm);
  if (addedDeps && addedDeps.length > 0) {
    findings.push({
      tool: "npm_audit",
      file: pkgFile.filePath,
      severity: "suggestion",
      message: `${addedDeps.length} new dependency(ies) added — run npm audit before merging`,
    });
  }

  const riskyPatterns = [
    /"node-fetch":\s*"[12]\./,
    /"lodash":\s*"<4\.17\.21"/,
    /"minimist":\s*"<1\.2\.6"/,
  ];

  for (const pattern of riskyPatterns) {
    if (pattern.test(pkgFile.patch)) {
      findings.push({
        tool: "npm_audit",
        file: pkgFile.filePath,
        severity: "issue",
        message: "Known vulnerable dependency version detected in package.json changes",
      });
    }
  }

  return findings;
}

export function runStaticAnalysis(
  files: PrFile[],
  config: GitclawConfig
): StaticAnalysisResult {
  const findings: StaticAnalysisFinding[] = [];
  const sa = config.static_analysis;

  for (const file of files) {
    if (sa.eslint) {
      findings.push(...scanPatch(file, ESLINT_PATTERNS, "eslint"));
    }
    if (sa.semgrep) {
      findings.push(...scanPatch(file, SEMGREP_PATTERNS, "semgrep"));
    }
    if (sa.gitleaks) {
      findings.push(...scanGitleaks(file));
    }
  }

  if (sa.npm_audit) {
    findings.push(...scanNpmAudit(files));
  }

  return { findings };
}

export function formatStaticAnalysisForPrompt(
  result: StaticAnalysisResult
): string {
  if (result.findings.length === 0) {
    return "";
  }

  const lines = result.findings.map(
    (f) =>
      `- [${f.tool}] ${f.file}${f.line ? `:${f.line}` : ""} (${f.severity}): ${f.message}`
  );

  return `## Static analysis results (automated)\n\nThe following issues were detected by automated tools. Include relevant ones in your findings and do not duplicate them unnecessarily.\n\n${lines.join("\n")}`;
}

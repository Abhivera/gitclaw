import { generateObject } from "ai";
import { getReviewModel } from "@/features/ai";
import {
  structuredReviewSchema,
  type StructuredReview,
} from "../types/review-finding";

const SYSTEM_PROMPT = `You are an expert code reviewer with deep knowledge of software engineering best practices, security, and performance optimization.

Review the provided unified diff and return structured findings with exact file paths and line numbers from the **new** (post-change) version of each file.

## Review Checklist

Analyze the changes across these dimensions (only report what's relevant):

- **Correctness** — Bugs, logic errors, off-by-one errors, incorrect assumptions
- **Security** — Injection risks, auth issues, exposed secrets, unsafe deserialization
- **Performance** — Unnecessary loops, missing indexes, N+1 queries, memory leaks
- **Reliability** — Unhandled errors/edge cases, missing null checks, race conditions
- **Readability** — Naming clarity, overly complex logic
- **Maintainability** — Tight coupling, duplication, SOLID/DRY violations

## Output rules

- \`summary\`: one sentence assessing overall change quality
- \`findings\`: line-level issues only — each must reference a file and line number visible in the diff
- Use severity \`issue\` for bugs, security problems, or breaking changes
- Use severity \`suggestion\` for non-blocking improvements
- Include \`suggestion\` with a code snippet when a concrete fix exists
- If the diff is clean, return an empty findings array — do not invent problems
- Reference line numbers from the new file (right side of the diff)`;

type ReviewInput = {
  repoFullName: string;
  title: string;
  diff: string;
  incremental?: boolean;
  context?: string;
  tone?: string;
  languageFocus?: string[];
  staticAnalysis?: string;
};

function buildToneInstruction(tone?: string): string {
  switch (tone) {
    case "detailed":
      return "Provide thorough explanations for each finding.";
    case "mentoring":
      return "Use a mentoring tone — explain the why behind each suggestion.";
    default:
      return "Be concise — short, actionable comments.";
  }
}

export async function generateReview(
  input: ReviewInput
): Promise<StructuredReview> {
  const scopeNote = input.incremental
    ? "This diff contains only commits since the last review."
    : "This diff contains the full pull request changes.";

  const toneNote = buildToneInstruction(input.tone);
  const languageNote = input.languageFocus?.length
    ? `Focus especially on: ${input.languageFocus.join(", ")}.`
    : "";

  const contextBlock = input.context?.trim()
    ? `\n\n${input.context.trim()}`
    : "";

  const staticBlock = input.staticAnalysis?.trim()
    ? `\n\n${input.staticAnalysis.trim()}`
    : "";

  const { object, usage } = await generateObject({
    model: getReviewModel(),
    schema: structuredReviewSchema,
    system: `${SYSTEM_PROMPT}\n\n${toneNote}${languageNote ? ` ${languageNote}` : ""}`,
    prompt: `Repository: ${input.repoFullName}
Pull request title: ${input.title}
${scopeNote}

## Changed files (unified diff)

${input.diff}${contextBlock}${staticBlock}`,
  });

  if (usage) {
    console.info("[gitclaw] review token usage", {
      repo: input.repoFullName,
      promptTokens: usage.inputTokens,
      completionTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
    });
  }

  return object;
}

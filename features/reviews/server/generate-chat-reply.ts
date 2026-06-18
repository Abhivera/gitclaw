import { generateText } from "ai";
import { getReviewModel } from "@/features/ai";
import type { ReviewFinding } from "../types/review-finding";

const SYSTEM_PROMPT = `You are GitClaw, an AI code review assistant embedded in pull request discussions.

You help developers understand review feedback, explain code changes, suggest fixes, and answer follow-up questions about the PR.

Rules:
- Be concise and helpful — developers are in a code review thread
- Reference specific files and lines when relevant
- If you don't have enough context to answer, say so honestly
- Do not invent findings that weren't in the review
- Format responses in markdown when helpful (code blocks, lists)
- Do not include @gitclaw in your reply`;

type ChatInput = {
  repoFullName: string;
  prTitle: string;
  prNumber: number;
  userMessage: string;
  reviewSummary: string | null;
  findings: ReviewFinding[];
};

export async function generateChatReply(input: ChatInput): Promise<string> {
  const findingsBlock =
    input.findings.length > 0
      ? `\n\n## Review findings\n${input.findings
          .map(
            (f) =>
              `- **${f.file}:${f.line}** (${f.severity}): ${f.body}${f.suggestion ? `\n  Suggestion: \`${f.suggestion}\`` : ""}`
          )
          .join("\n")}`
      : "";

  const summaryBlock = input.reviewSummary
    ? `\n\n## Review summary\n${input.reviewSummary}`
    : "";

  const { text, usage } = await generateText({
    model: getReviewModel(),
    system: SYSTEM_PROMPT,
    prompt: `Repository: ${input.repoFullName}
PR #${input.prNumber}: ${input.prTitle}
${summaryBlock}${findingsBlock}

## User message
${input.userMessage.replace(/@gitclaw\b/gi, "").trim()}`,
  });

  if (usage) {
    console.info("[gitclaw] chat token usage", {
      repo: input.repoFullName,
      promptTokens: usage.inputTokens,
      completionTokens: usage.outputTokens,
    });
  }

  return text;
}

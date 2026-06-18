import { generateText } from "ai";
import { getReviewModel } from "@/features/ai";
import type { PrFile } from "../types/review";
import { formatPrFilesForReview } from "./pr-files";

const SYSTEM_PROMPT = `You write clear, concise pull request descriptions from code diffs.

Output a markdown PR description with:
- A short summary paragraph (what and why)
- A "## Changes" section with bullet points per logical change
- A "## Testing" section with suggested test steps (if applicable)

Keep it professional and under 400 words. Do not invent features not present in the diff.`;

type DescriptionInput = {
  repoFullName: string;
  title: string;
  files: PrFile[];
};

export async function generatePrDescription(
  input: DescriptionInput
): Promise<string> {
  const diff = formatPrFilesForReview(input.files);

  const { text, usage } = await generateText({
    model: getReviewModel(),
    system: SYSTEM_PROMPT,
    prompt: `Repository: ${input.repoFullName}
PR title: ${input.title}

## Diff

${diff}`,
  });

  if (usage) {
    console.info("[gitclaw] description token usage", {
      repo: input.repoFullName,
      promptTokens: usage.inputTokens,
      completionTokens: usage.outputTokens,
    });
  }

  return text;
}

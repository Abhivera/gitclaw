import { env } from "@/lib/env";

type SlackReviewNotification = {
  webhookUrl: string;
  repoFullName: string;
  prNumber: number;
  title: string;
  provider: string;
  findingCount: number;
  issueCount: number;
  pullRequestId: string;
};

function getPullRequestUrl(input: SlackReviewNotification) {
  const origin = env.APP_URL;
  return `${origin}/dashboard/pull-request/${input.pullRequestId}`;
}

export async function sendSlackReviewNotification(
  input: SlackReviewNotification
) {
  const prUrl = getPullRequestUrl(input);
  const status =
    input.issueCount > 0
      ? `Found ${input.issueCount} issue(s)`
      : "No issues found";

  const payload = {
    text: `GitClaw finished reviewing ${input.repoFullName}#${input.prNumber}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*GitClaw review complete*\n<${prUrl}|${input.title}> (${input.provider})`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Repository*\n${input.repoFullName}` },
          { type: "mrkdwn", text: `*PR*\n#${input.prNumber}` },
          { type: "mrkdwn", text: `*Findings*\n${input.findingCount}` },
          { type: "mrkdwn", text: `*Result*\n${status}` },
        ],
      },
    ],
  };

  const response = await fetch(input.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook failed (${response.status}): ${text}`);
  }
}

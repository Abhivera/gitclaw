import type { GitProvider } from "./types";

export const GIT_PROVIDER_LABELS: Record<GitProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};

export const REVIEWABLE_GITHUB_ACTIONS = ["opened", "synchronize", "reopened"];

export const REVIEWABLE_GITLAB_ACTIONS = ["open", "update", "reopen"];

export const REVIEWABLE_BITBUCKET_EVENTS = [
  "pullrequest:created",
  "pullrequest:updated",
];

export const CHAT_BITBUCKET_EVENTS = ["pullrequest:comment_created"];

export const GITCLAW_MENTION = /@gitclaw\b/i;

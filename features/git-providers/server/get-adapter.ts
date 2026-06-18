import type { GitProvider } from "../types";
import { bitbucketAdapter } from "../bitbucket/adapter";
import { githubAdapter } from "../github/adapter";
import { gitlabAdapter } from "../gitlab/adapter";

const adapters = {
  github: githubAdapter,
  gitlab: gitlabAdapter,
  bitbucket: bitbucketAdapter,
} as const;

export function getProviderAdapter(provider: GitProvider) {
  return adapters[provider];
}

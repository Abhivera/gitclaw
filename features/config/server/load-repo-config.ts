import type { ProviderConnectionRecord } from "@/features/git-providers/types";
import { getProviderAdapter } from "@/features/git-providers/server/get-adapter";
import { prisma } from "@/lib/db";
import {
  DEFAULT_GITCLAW_CONFIG,
  gitclawConfigSchema,
  type GitclawConfig,
} from "../types/gitclaw-config";
import { parseGitclawConfig } from "./parse-config";

type RepositoryRecord = {
  id: string;
  fullName: string;
  provider: "github" | "gitlab" | "bitbucket";
  connectionId: string;
  config: unknown;
  configSha: string | null;
  defaultBranch: string | null;
};

export async function loadRepositoryConfig(
  connection: ProviderConnectionRecord,
  repository: RepositoryRecord,
  options?: { forceRefresh?: boolean }
): Promise<GitclawConfig> {
  if (!options?.forceRefresh && repository.config) {
    const cached = gitclawConfigSchema.safeParse(repository.config);
    if (cached.success) {
      return cached.data;
    }
  }

  const adapter = getProviderAdapter(repository.provider);
  const remote = await adapter.fetchGitclawConfig(
    connection,
    repository.fullName,
    repository.defaultBranch ?? undefined
  );

  if (!remote) {
    await prisma.repository.update({
      where: { id: repository.id },
      data: { config: DEFAULT_GITCLAW_CONFIG, configSha: null },
    });
    return DEFAULT_GITCLAW_CONFIG;
  }

  const config = parseGitclawConfig(remote.content);

  await prisma.repository.update({
    where: { id: repository.id },
    data: {
      config,
      configSha: remote.sha,
      defaultBranch: remote.defaultBranch ?? repository.defaultBranch,
    },
  });

  return config;
}

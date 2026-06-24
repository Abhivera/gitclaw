import {
  saveGithubConnection,
} from "@/features/git-providers/server/connections";
import { getGithubApp } from "./adapter";

function getAccountLogin(
  account: { login?: string; slug?: string } | null | undefined
): string | null {
  if (!account) {
    return null;
  }

  if ("login" in account && account.login) {
    return account.login;
  }

  if (account.slug) {
    return account.slug;
  }

  return null;
}

export async function saveInstallation(installationId: number) {
  const app = getGithubApp();

  const { data } = await app.octokit.request(
    "GET /app/installations/{installation_id}",
    { installation_id: installationId }
  );

  const accountLogin = getAccountLogin(data.account);

  await saveGithubConnection(
    installationId,
    accountLogin,
    data.target_type ?? null
  );
}

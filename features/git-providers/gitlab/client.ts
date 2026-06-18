import { env } from "@/lib/env";

function getGitlabBaseUrl() {
  return (env.GITLAB_BASE_URL ?? "https://gitlab.com").replace(/\/$/, "");
}

export { getGitlabBaseUrl };

function gitlabCredentials() {
  const clientId = env.GITLAB_CLIENT_ID;
  const clientSecret = env.GITLAB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GitLab is not configured. Set GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET."
    );
  }
  return { clientId, clientSecret };
}

export function getGitlabOAuthUrl(userId: string) {
  const { clientId } = gitlabCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${env.BETTER_AUTH_URL}/api/gitlab/callback`,
    response_type: "code",
    scope: "api read_api read_repository",
    state: userId,
  });

  return `${getGitlabBaseUrl()}/oauth/authorize?${params.toString()}`;
}

type GitlabRequestOptions = {
  accessToken: string;
  path: string;
  method?: string;
  body?: unknown;
};

export async function gitlabRequest<T>({
  accessToken,
  path,
  method = "GET",
  body,
}: GitlabRequestOptions): Promise<T> {
  const response = await fetch(`${getGitlabBaseUrl()}/api/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitLab API error (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function exchangeGitlabCode(code: string) {
  const response = await fetch(`${getGitlabBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: gitlabCredentials().clientId,
      client_secret: gitlabCredentials().clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${env.BETTER_AUTH_URL}/api/gitlab/callback`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitLab token exchange failed: ${text}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type: string;
  }>;
}

export async function getGitlabUser(accessToken: string) {
  return gitlabRequest<{
    id: number;
    username: string;
    name: string;
  }>({ accessToken, path: "/user" });
}

export async function refreshGitlabToken(refreshToken: string) {
  const response = await fetch(`${getGitlabBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: gitlabCredentials().clientId,
      client_secret: gitlabCredentials().clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      redirect_uri: `${env.BETTER_AUTH_URL}/api/gitlab/callback`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitLab token refresh failed: ${text}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type: string;
  }>;
}

import { env } from "@/lib/env";

const BITBUCKET_API = "https://api.bitbucket.org/2.0";

function bitbucketCredentials() {
  const clientId = env.BITBUCKET_CLIENT_ID;
  const clientSecret = env.BITBUCKET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Bitbucket is not configured. Set BITBUCKET_CLIENT_ID and BITBUCKET_CLIENT_SECRET."
    );
  }
  return { clientId, clientSecret };
}

export function getBitbucketOAuthUrl(userId: string) {
  const { clientId } = bitbucketCredentials();
  const redirectUri = `${env.BETTER_AUTH_URL}/api/bitbucket/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    state: userId,
    redirect_uri: redirectUri,
  });

  return `https://bitbucket.org/site/oauth2/authorize?${params.toString()}`;
}

type BitbucketRequestOptions = {
  accessToken: string;
  path: string;
  method?: string;
  body?: unknown;
};

export async function bitbucketRequest<T>({
  accessToken,
  path,
  method = "GET",
  body,
}: BitbucketRequestOptions): Promise<T> {
  const response = await fetch(`${BITBUCKET_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bitbucket API error (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as Promise<T>;
}

export async function exchangeBitbucketCode(code: string) {
  const { clientId, clientSecret } = bitbucketCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://bitbucket.org/site/oauth2/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${env.BETTER_AUTH_URL}/api/bitbucket/callback`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bitbucket token exchange failed: ${text}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }>;
}

export async function getBitbucketUser(accessToken: string) {
  return bitbucketRequest<{
    uuid: string;
    username: string;
    display_name: string;
  }>({ accessToken, path: "/user" });
}

export async function refreshBitbucketToken(refreshToken: string) {
  const { clientId, clientSecret } = bitbucketCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://bitbucket.org/site/oauth2/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bitbucket token refresh failed: ${text}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }>;
}

/** Split a unified diff into per-file patches. */
export function splitUnifiedDiff(diff: string): Array<{ filePath: string; patch: string }> {
  const files: Array<{ filePath: string; patch: string }> = [];
  const chunks = diff.split(/^diff --git /m).filter(Boolean);

  for (const chunk of chunks) {
    const headerEnd = chunk.indexOf("\n");
    if (headerEnd === -1) {
      continue;
    }

    const header = chunk.slice(0, headerEnd);
    const match = header.match(/a\/(.+?) b\/(.+)$/);
    const filePath = match?.[2] ?? match?.[1] ?? header;
    files.push({
      filePath,
      patch: `diff --git ${chunk.trim()}`,
    });
  }

  if (files.length === 0 && diff.trim()) {
    files.push({ filePath: "changes", patch: diff });
  }

  return files;
}

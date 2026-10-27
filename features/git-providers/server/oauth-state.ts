import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export async function createOAuthState(provider: string): Promise<string> {
  const state = randomBytes(32).toString("hex");
  (await cookies()).set(`gitclaw-oauth-${provider}`, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_URL?.startsWith("https:") ?? false,
    path: `/api/${provider}/callback`,
    maxAge: 600,
  });
  return state;
}

export async function validateOAuthState(provider: string, state: string | null): Promise<boolean> {
  const jar = await cookies();
  const name = `gitclaw-oauth-${provider}`;
  const expected = jar.get(name)?.value;
  jar.delete({ name, path: `/api/${provider}/callback` });
  if (!expected || !state || !/^[a-f0-9]{64}$/.test(state)) return false;
  const actualBuffer = Buffer.from(state);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

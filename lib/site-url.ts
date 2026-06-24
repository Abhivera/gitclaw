export function getSiteUrl(): string {
  return process.env.APP_URL ?? "https://gitclaw.online";
}

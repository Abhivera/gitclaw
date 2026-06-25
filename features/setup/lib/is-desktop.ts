export function isDesktopApp(): boolean {
  return process.env.GITCLAW_DESKTOP === "1";
}

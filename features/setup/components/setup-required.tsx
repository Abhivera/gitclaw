import { getEnvIssues } from "@/lib/env";

export function SetupRequired() {
  const issues = getEnvIssues();
  const isDesktop = process.env.GITCLAW_DESKTOP === "1";

  return (
    <div className="space-y-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-5 text-left">
      <div>
        <h2 className="text-sm font-semibold text-amber-50">Configuration required</h2>
        <p className="mt-1 text-sm leading-relaxed text-amber-100/85">
          GitClaw can show this page, but reviews need{" "}
          {isDesktop ? (
            <>
              a <code className="rounded bg-black/20 px-1 py-0.5 text-xs">.env</code> file in the
              desktop configuration folder (File → Open configuration folder).
            </>
          ) : (
            <>
              a local <code className="rounded bg-black/20 px-1 py-0.5 text-xs">.env</code> file.
            </>
          )}
        </p>
      </div>
      {!isDesktop && (
        <div className="rounded-lg bg-black/20 px-3 py-2 font-mono text-xs text-amber-50/90">
          cp .env.example .env
        </div>
      )}
      <ul className="space-y-1.5 text-sm text-amber-100/90">
        {issues.map((issue) => {
          const key = issue.path.join(".") || "(root)";
          return (
            <li key={key} className="flex gap-2">
              <span aria-hidden>•</span>
              <span>
                <code className="text-xs">{key}</code>: {issue.message}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs leading-relaxed text-amber-100/70">
        After updating <code className="text-xs">.env</code>, restart{" "}
        {isDesktop ? (
          <>the GitClaw desktop app</>
        ) : (
          <>
            <code className="text-xs">npm run dev</code>
          </>
        )}
        . See README for Postgres and AI provider setup.
      </p>
    </div>
  );
}

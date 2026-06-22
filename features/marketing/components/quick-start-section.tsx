import { CopyButton } from "@/components/ui/copy-button";
import { TerminalIcon } from "@phosphor-icons/react/dist/ssr";
import { REPO, URLS } from "@/features/marketing/lib/releases";

const DOCKER_QUICK_START = `git clone https://github.com/${REPO}.git
cd gitclaw
cp .env.example .env
# Fill in .env — see README for required variables
docker compose up --build`;

const MANUAL_QUICK_START = `git clone https://github.com/${REPO}.git
cd gitclaw
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:migrate
npm run dev`;

export function QuickStartSection() {
  return (
    <section
      aria-labelledby="quick-start-heading"
      className="mb-14 rounded-2xl border border-white/[0.08] bg-[#0a0e14]/90 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
    >
      <div className="mb-4 flex items-center gap-2 text-[#b29bbd]">
        <TerminalIcon className="h-4 w-4" aria-hidden />
        <h2 id="quick-start-heading" className="text-sm font-medium">
          Self-host in minutes
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        Run GitClaw on your own infrastructure with Docker, or install manually for local
        development. Connect GitHub, GitLab, or Bitbucket from the dashboard after sign-in.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">Docker (recommended)</p>
            <CopyButton
              value={DOCKER_QUICK_START}
              label="Copy"
              className="border-white/10 bg-black/30 text-zinc-300 hover:bg-black/50"
            />
          </div>
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300 ring-1 ring-white/[0.06] sm:text-sm">
            {DOCKER_QUICK_START}
          </pre>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">Manual install</p>
            <CopyButton
              value={MANUAL_QUICK_START}
              label="Copy"
              className="border-white/10 bg-black/30 text-zinc-300 hover:bg-black/50"
            />
          </div>
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300 ring-1 ring-white/[0.06] sm:text-sm">
            {MANUAL_QUICK_START}
          </pre>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        Full setup guide in the{" "}
        <a
          href={URLS.repo}
          className="text-[#8d6e9e] hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          open-source repository
        </a>
        .
      </p>
    </section>
  );
}

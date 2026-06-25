import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { QuickstartCodeBlock } from "@/features/marketing/components/quickstart-code-block";
import { REPO, URLS } from "@/features/marketing/lib/releases";
import { BRAND_ICON_DARK } from "@/lib/brand";
import "./landing-page.css";
import "./quickstart-page.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-landing-mono",
});

const DOCKER_INSTALL = `git clone https://github.com/${REPO}.git
cd gitclaw
cp .env.example .env
docker compose up --build`;

const MANUAL_CLONE = `git clone https://github.com/${REPO}.git
cd gitclaw
npm install`;

const MANUAL_POSTGRES = `docker compose up -d postgres`;

const MANUAL_ENV = `cp .env.example .env`;

const MANUAL_MIGRATE = `npm run db:migrate`;

const MANUAL_DEV = `npm run dev`;

const PRODUCTION_BUILD = `npm run build
npm run start`;

const TUNNEL_NGROK = `ngrok http 3000`;

const TUNNEL_CLOUDFLARED = `cloudflared tunnel --url http://127.0.0.1:3000`;

export function QuickstartPage() {
  return (
    <div className={`marketing-landing ${jetbrainsMono.variable}`}>
      <div className="scratches" aria-hidden />

      <div className="topbar">
        <div className="wrap">
          <Link href="/" className="brand">
            <Image src={BRAND_ICON_DARK} alt="GitClaw" width={22} height={22} priority />
            <span>
              gitclaw<span className="dot">.</span>
            </span>
          </Link>
          <nav className="topnav" aria-label="Quickstart sections">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <a href="#install">Install</a>
            <span className="sep">/</span>
            <a href="#configure">Configure</a>
            <span className="sep">/</span>
            <a href="#deploy">Deploy</a>
            <span className="sep">/</span>
            <a href="#connect">Connect</a>
            <span className="sep">/</span>
            <a href="#use">Use</a>
          </nav>
        </div>
      </div>

      <div className="wrap">
        <header className="guide-hero">
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            QUICKSTART
          </div>
          <h1>Install, deploy, and review PRs</h1>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Step-by-step guide from clone to your first automated review — Docker, manual install,
            or desktop app.
          </p>
          <nav className="guide-toc" aria-label="On this page">
            <a href="#prerequisites">Prerequisites</a>
            <a href="#install">Install</a>
            <a href="#configure">Configure</a>
            <a href="#deploy">Deploy</a>
            <a href="#connect">Connect providers</a>
            <a href="#use">First review</a>
          </nav>
        </header>

        <hr className="rule" />

        <section id="prerequisites" className="guide-section">
          <div className="eyebrow">BEFORE YOU START</div>
          <h2>Prerequisites</h2>
          <p className="section-desc">
            You need a few things ready before GitClaw can review pull requests.
          </p>
          <div className="guide-steps">
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">✓</span>
                <h3>Runtime</h3>
              </div>
              <p>
                <b>Docker path:</b> Docker and Docker Compose. <b>Manual path:</b> Node.js 20.9+ and
                npm. <b>Desktop path:</b> download an installer — no Docker required.
              </p>
            </div>
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">✓</span>
                <h3>AI provider</h3>
              </div>
              <p>
                An API key from{" "}
                <a href="https://openrouter.ai" target="_blank" rel="noreferrer">
                  OpenRouter
                </a>
                ,{" "}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">
                  Anthropic
                </a>
                ,{" "}
                <a href="https://console.groq.com" target="_blank" rel="noreferrer">
                  Groq
                </a>
                , or a local OpenAI-compatible server such as{" "}
                <a href="https://ollama.com" target="_blank" rel="noreferrer">
                  Ollama
                </a>
                .
              </p>
            </div>
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">✓</span>
                <h3>Git host</h3>
              </div>
              <p>
                A{" "}
                <a
                  href="https://github.com/settings/apps"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub App
                </a>{" "}
                for GitHub reviews. GitLab and/or Bitbucket OAuth apps only if you use those
                providers.
              </p>
            </div>
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">✓</span>
                <h3>Public URL for webhooks</h3>
              </div>
              <p>
                Git providers must reach your instance to deliver PR events. Use your production
                domain, or a tunnel (ngrok, cloudflared) while developing locally.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section id="install" className="guide-section">
          <div className="eyebrow">STEP 1</div>
          <h2>Install GitClaw</h2>
          <p className="section-desc">Pick one path. Docker is the fastest way to get running.</p>

          <div className="path-tabs" aria-hidden>
            <span className="path-tab">Docker (recommended)</span>
            <span className="path-tab">Manual</span>
            <span className="path-tab">Desktop app</span>
          </div>

          <div className="guide-steps">
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">A</span>
                <h3>Docker — clone and start</h3>
              </div>
              <p>
                The compose stack runs Postgres and the app. Migrations apply automatically on
                container start.
              </p>
              <QuickstartCodeBlock label="Terminal" value={DOCKER_INSTALL} />
              <p style={{ marginTop: 12 }}>
                Open{" "}
                <a href="http://localhost:3000" target="_blank" rel="noreferrer">
                  http://localhost:3000
                </a>{" "}
                when the containers are healthy. Skip to{" "}
                <a href="#configure">Configure</a> to fill in <code>.env</code>.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">B</span>
                <h3>Manual — clone, Postgres, migrate, run</h3>
              </div>
              <ol>
                <li>Clone and install dependencies:</li>
              </ol>
              <QuickstartCodeBlock label="1. Clone" value={MANUAL_CLONE} />
              <ol start={2}>
                <li>Start Postgres (listens on port 5438, database <code>gitclaw</code>):</li>
              </ol>
              <QuickstartCodeBlock label="2. Postgres" value={MANUAL_POSTGRES} />
              <ol start={3}>
                <li>Copy the example env file — you will edit it in the next section:</li>
              </ol>
              <QuickstartCodeBlock label="3. Environment" value={MANUAL_ENV} />
              <ol start={4}>
                <li>Apply database migrations:</li>
              </ol>
              <QuickstartCodeBlock label="4. Migrate" value={MANUAL_MIGRATE} />
              <ol start={5}>
                <li>Start the dev server (background workers start automatically):</li>
              </ol>
              <QuickstartCodeBlock label="5. Run" value={MANUAL_DEV} />
              <p style={{ marginTop: 12 }}>
                Open{" "}
                <a href="http://localhost:3000" target="_blank" rel="noreferrer">
                  http://localhost:3000
                </a>
                .
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">C</span>
                <h3>Desktop app — download and launch</h3>
              </div>
              <ol>
                <li>
                  Download the latest installer from{" "}
                  <a href={URLS.releasesLatest} target="_blank" rel="noreferrer">
                    GitHub Releases
                  </a>{" "}
                  (Windows <code>.exe</code>, macOS <code>.dmg</code>, Linux{" "}
                  <code>.AppImage</code> or <code>.deb</code>).
                </li>
                <li>Install and open GitClaw. The dashboard opens automatically.</li>
                <li>
                  Go to <b>File → Open configuration folder</b> and edit <code>.env</code> with your
                  GitHub App and AI keys.
                </li>
                <li>Restart the app after saving configuration.</li>
              </ol>
              <p>
                The desktop app uses an embedded Postgres instance — no separate database setup.
                For webhooks, use a tunnel and set <code>APP_URL</code> plus{" "}
                <code>ALLOWED_DEV_ORIGINS</code> to your public hostname (see{" "}
                <a href="#deploy">Deploy</a>).
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section id="configure" className="guide-section">
          <div className="eyebrow">STEP 2</div>
          <h2>Configure environment</h2>
          <p className="section-desc">
            Edit <code>.env</code> in the project root (or the desktop configuration folder). Restart
            the app after changes.
          </p>

          <div className="guide-steps">
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">1</span>
                <h3>Copy the template</h3>
              </div>
              <p>
                If you have not already: <code>cp .env.example .env</code>
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">2</span>
                <h3>Set required variables</h3>
              </div>
              <table className="env-table">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>APP_URL</code>
                    </td>
                    <td>
                      Public URL of your instance (e.g. <code>http://localhost:3000</code> locally,
                      or your production domain).
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>DATABASE_URL</code>
                    </td>
                    <td>
                      Postgres connection string. Docker and desktop set this automatically; manual
                      install uses port <code>5438</code> by default.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>GITHUB_APP_ID</code>
                    </td>
                    <td>GitHub App ID from your app settings.</td>
                  </tr>
                  <tr>
                    <td>
                      <code>GITHUB_APP_PRIVATE_KEY</code>
                    </td>
                    <td>
                      PEM private key. Use <code>\n</code> for newlines inside <code>.env</code>.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>GITHUB_WEBHOOK_SECRET</code>
                    </td>
                    <td>Webhook secret from the GitHub App.</td>
                  </tr>
                  <tr>
                    <td>
                      <code>GITHUB_APP_SLUG</code>
                    </td>
                    <td>App slug — used for the install URL in the dashboard.</td>
                  </tr>
                  <tr>
                    <td>
                      <code>OPENROUTER_API_KEY</code> / <code>ANTHROPIC_API_KEY</code> /{" "}
                      <code>GROQ_API_KEY</code>
                    </td>
                    <td>
                      Set one AI provider key, or configure <code>OPENAI_BASE_URL</code> for
                      Ollama or another OpenAI-compatible endpoint.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">3</span>
                <h3>Optional: GitLab and Bitbucket</h3>
              </div>
              <p>
                Add <code>GITLAB_CLIENT_ID</code> and <code>GITLAB_CLIENT_SECRET</code>, or{" "}
                <code>BITBUCKET_CLIENT_ID</code> and <code>BITBUCKET_CLIENT_SECRET</code>, only if
                you connect those providers. Self-hosted GitLab: set <code>GITLAB_BASE_URL</code>.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section id="deploy" className="guide-section">
          <div className="eyebrow">STEP 3</div>
          <h2>Deploy for production</h2>
          <p className="section-desc">
            Webhooks require a URL that GitHub, GitLab, or Bitbucket can reach from the internet.
          </p>

          <div className="guide-steps">
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">1</span>
                <h3>Production server</h3>
              </div>
              <p>
                <b>Docker:</b> run <code>docker compose up -d --build</code> on your server with{" "}
                <code>APP_URL</code> set to your public HTTPS URL.
              </p>
              <p>
                <b>Manual:</b> build and start the production server behind your reverse proxy
                (nginx, Caddy, etc.):
              </p>
              <QuickstartCodeBlock label="Production" value={PRODUCTION_BUILD} />
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">2</span>
                <h3>Local development with a tunnel</h3>
              </div>
              <p>Start a tunnel to your local port, then add the public hostname to your config.</p>
              <QuickstartCodeBlock label="ngrok" value={TUNNEL_NGROK} />
              <QuickstartCodeBlock label="cloudflared" value={TUNNEL_CLOUDFLARED} />
              <p style={{ marginTop: 12 }}>
                Set <code>ALLOWED_DEV_ORIGINS</code> to your tunnel hostname (e.g.{" "}
                <code>abc123.ngrok-free.app</code>). Update <code>APP_URL</code> if needed. GitClaw
                reloads configuration on save.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">3</span>
                <h3>HTTPS</h3>
              </div>
              <p>
                Git providers expect HTTPS webhook endpoints in production. Terminate TLS at your
                load balancer or reverse proxy before traffic reaches GitClaw.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section id="connect" className="guide-section">
          <div className="eyebrow">STEP 4</div>
          <h2>Connect providers</h2>
          <p className="section-desc">
            Open the dashboard at <code>APP_URL</code> and go to <b>Integrations</b>.
          </p>

          <div className="guide-steps">
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">1</span>
                <h3>GitHub</h3>
              </div>
              <ol>
                <li>
                  Create a GitHub App with pull request and repository contents read permissions.
                </li>
                <li>
                  Set the webhook URL to{" "}
                  <code>https://&lt;your-host&gt;/api/github/webhook</code>.
                </li>
                <li>
                  Set <code>GITHUB_APP_SLUG</code> in <code>.env</code> and restart if needed.
                </li>
                <li>
                  In the dashboard, click <b>Connect GitHub</b> and install the app on your
                  repositories.
                </li>
              </ol>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">2</span>
                <h3>GitLab</h3>
              </div>
              <ol>
                <li>
                  Create a GitLab OAuth application with callback{" "}
                  <code>https://&lt;your-host&gt;/api/gitlab/callback</code>.
                </li>
                <li>Authorize from the dashboard.</li>
                <li>
                  Add the webhook URL shown on the integration card to your project (merge request
                  events).
                </li>
              </ol>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">3</span>
                <h3>Bitbucket</h3>
              </div>
              <ol>
                <li>
                  Create a Bitbucket OAuth consumer with callback{" "}
                  <code>https://&lt;your-host&gt;/api/bitbucket/callback</code>.
                </li>
                <li>Authorize from the dashboard.</li>
                <li>
                  Add the webhook URL shown on the integration card to your repo (pull request
                  events).
                </li>
              </ol>
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section id="use" className="guide-section">
          <div className="eyebrow">STEP 5</div>
          <h2>Run your first review</h2>
          <p className="section-desc">
            Once a provider is connected, GitClaw reviews pull requests automatically.
          </p>

          <div className="guide-steps">
            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">1</span>
                <h3>Open or update a pull request</h3>
              </div>
              <p>
                GitClaw listens for PR open and update webhooks. It diffs only what changed since
                the last review, so follow-up commits do not re-review the entire PR.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">2</span>
                <h3>Read inline comments and summary</h3>
              </div>
              <p>
                Findings appear as inline comments on the PR plus a summary. Categories include
                security, performance, and maintainability.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">3</span>
                <h3>Reply with @gitclaw</h3>
              </div>
              <p>
                Mention <code>@gitclaw</code> in a PR comment to ask follow-up questions in
                context.
              </p>
            </div>

            <div className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">4</span>
                <h3>Tune per repo (optional)</h3>
              </div>
              <p>
                Add a <code>.gitclaw.yaml</code> in any repository to set ignore paths, review tone,
                and custom instructions. Track activity from the dashboard overview and analytics
                pages.
              </p>
            </div>
          </div>

          <div className="cta-row" style={{ marginTop: 40 }}>
            <Link href="/dashboard/integrations" className="btn btn-primary">
              Open integrations
            </Link>
            <Link href="/" className="btn btn-ghost">
              Back to home
            </Link>
          </div>
        </section>
      </div>

      <footer className="landing-footer">
        <div className="wrap">
          <span>GitClaw — MIT licensed</span>
          <span>
            <a href={URLS.repo} target="_blank" rel="noreferrer">
              {URLS.repo.replace("https://github.com/", "")}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

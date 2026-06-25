import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import { URLS } from "@/features/marketing/lib/releases";
import { BRAND_ICON_DARK, BRAND_ICON_MARK } from "@/lib/brand";
import "./landing-page.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-landing-mono",
});

const FEATURES = [
  {
    mark: "01",
    title: "Reviews on every push",
    body: "Webhooks fire on open and update. GitClaw diffs only what changed, so a follow-up commit doesn't re-review the whole PR.",
  },
  {
    mark: "02",
    title: "Security & code quality",
    body: (
      <>
        Flags injection risks, unsafe patterns, and style violations before they reach{" "}
        <code>main</code> — not after.
      </>
    ),
  },
  {
    mark: "03",
    title: "Performance insights",
    body: "Catches hot-path inefficiency, redundant work, and regressions that quietly slow a service down over time.",
  },
  {
    mark: "04",
    title: "Maintainability feedback",
    body: "Calls out complexity and duplication while it's still cheap to fix — not eighteen months later.",
  },
  {
    mark: "05",
    title: "Talk back to the review",
    body: (
      <>
        Reply to <code>@gitclaw</code> directly in a PR comment. It answers follow-up questions in
        context, no new tab required.
      </>
    ),
  },
  {
    mark: "06",
    title: "Per-repo configuration",
    body: (
      <>
        Drop a <code>.gitclaw.yaml</code> in any repo to set ignore paths, review tone, and custom
        instructions.
      </>
    ),
  },
  {
    mark: "07",
    title: "Dashboard & analytics",
    body: "Track findings across every repo and team in one place. See what gets caught, and what keeps recurring.",
  },
  {
    mark: "08",
    title: "Bring your own model",
    body: (
      <>
        Pluggable AI backend — OpenRouter, Anthropic (Claude), Groq, or any OpenAI-compatible endpoint, including a local{" "}
        <code>Ollama</code> instance.
      </>
    ),
  },
] as const;

function LogoMark({ className, width, height }: { className: string; width: number; height: number }) {
  return (
    <Image
      src={BRAND_ICON_MARK}
      alt=""
      width={width}
      height={height}
      className={className}
      aria-hidden
    />
  );
}

export function LandingPage() {
  return (
    <div className={`marketing-landing ${jetbrainsMono.variable}`}>
      <div className="scratches" aria-hidden />

      <div className="topbar">
        <div className="wrap">
          <div className="brand">
            <Image src={BRAND_ICON_DARK} alt="GitClaw" width={22} height={22} priority />
            <span>
              gitclaw<span className="dot">.</span>
            </span>
          </div>
          <nav className="topnav" aria-label="Page sections">
            <a href="#features">Features</a>
            <span className="sep">/</span>
            <a href="#self-host">Self-hosting</a>
            <span className="sep">/</span>
            <a href={URLS.quickstart}>Quickstart</a>
            <span className="sep">/</span>
            <a href={URLS.repo} target="_blank" rel="noreferrer">
              Source
            </a>
          </nav>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <LogoMark className="hero-mark" width={52} height={52} />
          <div className="prompt-line">
            $ gitclaw review --pr 482<span className="blink" aria-hidden />
          </div>

          <h1>
            An AI reviewer that reads your diffs — <span className="crit">not your code</span>.
          </h1>

          <p className="sub">
            GitClaw is an <b>open-source, self-hosted</b> alternative to CodeRabbit. It runs on
            your own infrastructure, reviews pull requests on <b>GitHub</b>, <b>GitLab</b>, and{" "}
            <b>Bitbucket</b>, and leaves inline comments on the lines that actually matter —{" "}
            <code>security</code>, <code>performance</code>, <code>maintainability</code>. No code
            ever leaves your servers.
          </p>

          <div className="cta-row">
            <a href={URLS.quickstart} className="btn btn-primary">
              Quickstart
            </a>
          </div>
          <div className="meta-line">
            MIT licensed ·{" "}
            <a href={`${URLS.repo}/releases`} target="_blank" rel="noreferrer">
              see all releases
            </a>
          </div>

          <div className="term" aria-label="Example pull request review">
            <div className="term-bar">
              <span className="tdot" />
              <span className="tdot" />
              <span className="tdot amber" />
              <span className="tlabel">pull_request #482 · payments-service</span>
            </div>
            <div className="term-body">
              <div className="ln">
                <span className="num">14</span>
                <span className="gh">+</span>
                <span className="file">
                  {"  await db.query(`SELECT * FROM users WHERE id = ${userId}`)"}
                </span>
              </div>
              <div className="ln indent">
                <span className="claw">⟫</span>
                <span className="comment">
                  <span className="pill">security</span>
                  Unescaped <code>userId</code> goes straight into the query string — this is
                  injectable. Use a parameterized query instead.
                </span>
              </div>
              <div className="ln">
                <span className="num">31</span>
                <span className="gh">+</span>
                <span className="file">
                  {"  items.forEach(i => results.push(transform(i)))"}
                </span>
              </div>
              <div className="ln indent">
                <span className="claw">⟫</span>
                <span className="comment">
                  <span className="pill">performance</span>
                  This rebuilds <code>results</code> on every render.{" "}
                  <code>items.map(transform)</code> avoids the mutation and reads cleaner too.
                </span>
              </div>
              <div className="ln">
                <span className="num">58</span>
                <span className="gh">+</span>
                <span className="file">{"  @gitclaw why flag this as high severity?"}</span>
              </div>
              <div className="ln indent">
                <span className="claw">⟫</span>
                <span className="comment">
                  This table holds payment metadata — an injection here reaches billing data, not
                  just user profiles. That&apos;s why it&apos;s high, not medium.
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr className="rule" />

        <section id="features">
          <div className="eyebrow">WHY TEAMS RUN THEIR OWN</div>
          <h2>Eight things it actually does</h2>
          <p className="section-desc">
            Not a feature wishlist — this is what ships in the current release.
          </p>

          <div className="features">
            {FEATURES.map((feature) => (
              <div key={feature.mark} className="feat">
                <span className="mark">⟫ {feature.mark}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule" />

        <section id="self-host">
          <div className="eyebrow">YOUR SERVERS, YOUR CODE</div>
          <h2>Self-hosted means self-hosted</h2>
          <p className="section-desc" style={{ marginBottom: 0 }}>
            GitClaw doesn&apos;t send your source to a third-party API to get reviewed. It runs
            wherever you already run things, talks to the model provider you choose, and keeps every
            diff inside infrastructure you control. The dashboard is yours; the data never leaves.
          </p>
        </section>

        <hr className="rule" />

        <div className="closing">
          <LogoMark className="closing-mark" width={26} height={26} />
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            GET STARTED
          </div>
          <h2>Point it at a repo. See what it finds.</h2>
          <p className="section-desc">
            Five-minute setup, MIT licensed, no usage limits because there&apos;s no meter to hit.
          </p>
          <div className="cta-row">
            <a href={URLS.quickstart} className="btn btn-primary">
              Quickstart
            </a>
            <a href={URLS.repo} className="btn btn-ghost" target="_blank" rel="noreferrer">
              Open source on GitHub <span className="arrow">↗</span>
            </a>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="wrap">
          <span className="footer-brand">
            <LogoMark className="footer-mark" width={16} height={16} />
            GitClaw — MIT licensed
          </span>
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

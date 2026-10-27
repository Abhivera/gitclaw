# GitClaw security

## Administrative access

Web and CLI installations require `GITCLAW_ADMIN_PASSWORD` with at least 16 characters.
Set it in the server environment or CLI configuration file, restart, then sign in
using username `admin` and that password in the browser authentication dialog.
Generate a random password with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Administration fails closed with HTTP 503 when no valid credential is configured.
Dashboard pages, dashboard APIs, configuration APIs, provider connection routes,
and callbacks require authentication. Server actions additionally check credentials.
Write requests require an Origin matching the request origin or configured APP_URL.
Use HTTPS for network access; HTTP Basic credentials are not encrypted by HTTP.
Rotate the password by changing the environment and restarting. This is a
single-administrator deployment model, without individual accounts or roles.

Electron generates a random credential for each application process, passes it
to its server, and injects it only into requests to the exact local server origin.
It is not written to disk or exposed through the preload API. Restarting Electron
rotates it. CLI installations require the administrator password even in desktop
configuration mode. A normal browser opening the Electron server also needs an
administrator password if that access is desired.

Provider webhook endpoints remain outside administrator authentication and use
provider verification. Expose only webhook paths through public tunnels when
possible. Never use a proxy that copies administrator headers onto public requests.
Provider authorization uses a random state cookie scoped to its callback, valid
for ten minutes and consumed on callback. Start authorization and complete the
callback in the same browser session and hostname. Electron connection flows
must return to the Electron browser session; switching to a separate browser
requires starting a new authorization there with administrator credentials.

## AI data handling

Review, chat, and description generation use a shared untrusted-content policy.
Repository instructions cannot override it. Known token formats, common secret
assignments, private-key blocks, credential URLs, and bearer credentials are
redacted before model requests and in generated text. Sensitive file paths such
as `.env`, private keys, and credentials files are excluded from model diffs and
context fetching. Pattern detection cannot recognize every possible credential.
Use a trusted local AI endpoint when source code must stay on your infrastructure.

Prompts above 100,000 characters fail rather than being silently truncated. Each
model operation has a 60-second timeout, one retry and an 8,000-token output cap.
Chunked reviews permit at most 32 chunks and retain complete diff hunks. A single
oversized hunk can therefore fail the input limit; narrow the review scope.

Generated findings must reference a file and right-side line present in the diff.
Duplicate, empty, oversized and invalid findings are removed before posting or
storage. Text is redacted and remote image markup is removed. Suggested code is
advisory and is never executed or applied automatically. Prompt policy reduces
risk but cannot guarantee immunity to prompt injection.

## Analysis and validation

The current `eslint`, `semgrep`, `gitleaks` and `npm_audit` configuration switches
control built-in heuristics. They do not execute those external scanners or
provide a complete vulnerability assessment. Checks run on added diff lines and
use actual new-file coordinates. Real scanner isolation, dependency advisory
integration, webhook replay/rate limits, encrypted provider-token storage,
individual accounts and broader desktop hardening remain follow-up work.

The Electron renderer runs with sandboxing and context isolation enabled and
Node integration disabled. Its CommonJS preload uses only sandbox-supported
Electron APIs. Desktop IPC checks the sender window, main frame and origin.
External window links are limited to HTTP/HTTPS; local window links must match
the server origin exactly. Electron and electron-builder were upgraded to address
dependency advisories; packaged installers still require platform smoke testing.

Local folder reviews require a native folder selection and a separate confirmation
for each review. The preview names the included files, endpoint and model. The
desktop process retains the bounded snapshot and accepts a one-use selection;
the API checks hashes of the snapshot and current AI destination before calling
the model. A configuration change requires a new preview and confirmation.
Project scripts are not executed. File-size, total-size and traversal budgets,
hidden/dependency/secret-file exclusions, `.gitignore` rules and symlink rejection
limit collection. Only the confirmed snapshot is sent to the selected provider.
Results stay in the current window unless the user copies them.

CI audits all three package lockfiles and blocks high/critical dependency
advisories. An audit passing means no known advisories were reported for that
dependency graph at the time; it is not a general security guarantee.

Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` before
shipping. Tests cover credential rejection, protected/public route boundaries,
cross-origin writes, diff coordinates, finding validation, secret redaction,
sensitive-file exclusion, chunk boundaries, input budgets and malformed YAML.

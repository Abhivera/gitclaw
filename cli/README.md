# GitClaw

Open-source, self-hosted AI pull request reviewer for **GitHub**, **GitLab**, and **Bitbucket**. Connect a provider from the dashboard and every opened or updated PR gets an automated review — a summary plus inline comments covering correctness, security, performance, and maintainability.

This package runs the full GitClaw server (dashboard, webhook API, and background workers) from a single command. See [gitclaw.online](https://gitclaw.online) and the [GitHub repository](https://github.com/Abhivera/gitclaw) for full documentation.

## Quick start

With your own PostgreSQL:

```bash
npx gitclaw-cli init          # creates ~/.gitclaw/.env — set DATABASE_URL + keys
npx gitclaw-cli start
```

Or fully self-contained (downloads a bundled PostgreSQL on first use):

```bash
npx gitclaw-cli start --embedded-db
```

Set `GITCLAW_ADMIN_PASSWORD` in `~/.gitclaw/.env` to a random password of at least
16 characters, then restart. Open [http://localhost:3000](http://localhost:3000),
sign in with username `admin` and that password, and finish setup from the dashboard.

You can also install globally: `npm install -g gitclaw-cli`, then use the `gitclaw` command.

## Commands

| Command | Description |
| --- | --- |
| `gitclaw start` | Run migrations and start the server |
| `gitclaw init` | Create `~/.gitclaw/.env` and print its path |
| `gitclaw migrate` | Run database migrations only |
| `gitclaw doctor` | Print environment diagnostics |

## Options

| Option | Description |
| --- | --- |
| `--port <port>` | Port to listen on (default `3000`) |
| `--host <host>` | Host to bind (default `127.0.0.1`; use `0.0.0.0` on servers) |
| `--embedded-db` | Use a bundled PostgreSQL instead of `DATABASE_URL` |
| `--db-port <port>` | Embedded PostgreSQL port (default `15433`) |

## Configuration

All state lives in `~/.gitclaw` (override with the `GITCLAW_HOME` environment variable):

- `.env` — instance configuration (database, git providers, AI provider keys)
- `app/` — extracted server bundle
- `postgres-data/` — embedded PostgreSQL data (when using `--embedded-db`)

Settings can be edited in the `.env` file or from the dashboard at **Settings → Configuration**; the server restarts automatically when the file changes.

Git providers must be able to reach your instance for webhooks. On a laptop, use a tunnel (ngrok, cloudflared) and set `APP_URL` and `ALLOWED_DEV_ORIGINS` accordingly.

## Requirements

- Node.js 20.9 or newer
- PostgreSQL (any instance), or use `--embedded-db`

## License

[MIT](https://github.com/Abhivera/gitclaw/blob/main/LICENSE)

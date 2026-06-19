# Contributing to GitClaw

Thank you for your interest in contributing! GitClaw is an open-source AI pull request reviewer for GitHub, GitLab, and Bitbucket.

## Getting started

### Prerequisites

- Node.js 20.9+
- Docker (for Postgres, or full stack)
- A GitHub OAuth app for local sign-in (see [README.md](./README.md))

### Local setup

```bash
git clone https://github.com/Abhivera/gitclaw.git
cd gitclaw
npm install
cp .env.example .env
# Fill in .env — see README for required variables
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in via **Dashboard → Integrations**.

### Verify your changes

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep changes focused — one logical change per PR when possible.
3. Follow existing code style and conventions in the surrounding files.
4. Update documentation if you change setup, env vars, or user-facing behavior.
5. Fill in the pull request template.

## Code guidelines

- **TypeScript** — Prefer explicit types at module boundaries; avoid `any`.
- **Scope** — Do not refactor unrelated code in the same PR.
- **Env vars** — Add new variables to `.env.example` and document them in the README.
- **Database** — Run `npm run db:migrate` for schema changes and commit the migration files.

## Project structure

See the [Project structure](./README.md#project-structure) section in the README for an overview of `app/`, `features/`, and `lib/`.

## Questions

Open a [GitHub Discussion](https://github.com/Abhivera/gitclaw/discussions) or an issue if you are unsure whether a change fits before investing significant time.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

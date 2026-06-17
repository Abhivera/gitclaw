# GitClaw

**[gitclaw.online](https://gitclaw.online)** — Marketing site for GitClaw. Built with Vite, React, and TypeScript.

## Run locally

```bash
cd website
npm install
npm run dev
```

## Build

```bash
cd website
npm run build
```

Production output is written to `website/dist`.

## Deploy to Vercel

The repo root includes **`vercel.json`**, which installs and builds the `website` package and publishes **`website/dist`**:

- **Import** this GitHub repo in the [Vercel dashboard](https://vercel.com) (root directory `.`).
- Or from the repo root: `npx vercel` (preview) / `npx vercel --prod` (production), after `vercel login`.

## License

MIT

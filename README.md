# GitClaw

**[gitclaw.online](https://gitclaw.online)** — Desktop app to back up your GitHub repositories on your own machine. Built with Electron, React, and TypeScript; runs locally on **Windows** and **Linux**.

![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **GitHub backup** — Personal Access Token (classic or fine-grained), list repos, clone or update with all branches
- **Incremental updates** — First run clones; later runs fetch and pull
- **Filters** — Owned, organization, starred, forked, collaborator repos
- **Scheduling** — Daily / weekly / monthly backups with system tray
- **Concurrency** — Configurable parallel repo operations
- **Progress** — Per-repo status and log output

## Run locally (Windows & Linux)

### Prerequisites

1. **[Node.js](https://nodejs.org/)** 20 LTS (or 18+)  
2. **[Git](https://git-scm.com/)** installed and on your `PATH` (`git --version` works in a terminal)

### Clone and install

```bash
git clone <your-repo-url>
cd gitclaw
npm install
```

### Development (hot reload + Electron)

```bash
npm run dev
```

### Production build in this repo

```bash
npm run build
```

### Create installers (same OS you build on)

| Command | Output (under `release/`) |
|---------|---------------------------|
| `npm run package:win` | NSIS `.exe` (Windows) |
| `npm run package:linux` | `.AppImage` and `.deb` (Linux) |
| `npm run package` | Targets for the **current** platform |

**Linux:** For AppImage, mark executable then run: `chmod +x GitClaw-*.AppImage && ./GitClaw-*.AppImage`. For `.deb`, install with your package manager (e.g. `sudo apt install ./GitClaw_*.deb`).

**Windows:** If SmartScreen warns on an unsigned build, use “More info” → “Run anyway” (signing removes this for end users).

### GitHub token

1. [github.com/settings/tokens](https://github.com/settings/tokens)  
2. Create a **classic** token with `repo` and `read:org`, or a **fine-grained** token with access to the repos you need.  
3. Paste the token into GitClaw on the Setup screen.

## CI releases

Tag a version (e.g. `v1.0.1`) and push the tag to build artifacts in GitHub Actions (Windows, Linux, and macOS matrices in `.github/workflows/release.yml`).

## Project layout

```
├── electron/
│   ├── main.ts, preload.ts, tray.ts, ipc/, services/, store/
│   └── src/            # React UI (renderer)
├── public/             # Static assets (e.g. tray icon in dev)
├── resources/          # Icons for electron-builder
└── release/            # Packaged apps (after package)
```

## License

MIT

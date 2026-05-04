# GitClaw

**[gitclaw.online](https://gitclaw.online)** — Desktop app to back up your GitHub repositories on your own machine. Built with Electron, React, and TypeScript; runs locally on **Windows**, **Linux**, and **macOS**.

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

## Run locally (Windows, Linux & macOS)

### Prerequisites

1. **[Node.js](https://nodejs.org/)** 20 LTS (or 18+)  
2. **[Git](https://git-scm.com/)** on your `PATH` (`git --version` works in a terminal). On macOS, install [Xcode Command Line Tools](https://developer.apple.com/library/archive/technotes/tn2339/_index.html) (includes `git`) or Git from the link above.

Install Git from the official downloads, or use your OS package manager:

| OS | Command / link |
|----|----------------|
| **Linux** (Debian / Ubuntu) | `sudo apt update && sudo apt install -y git` — [git-scm.com/download/linux](https://git-scm.com/download/linux) |
| **Windows** | `winget install --id Git.Git -e --source winget` — [git-scm.com/download/win](https://git-scm.com/download/win) |
| **macOS** | `brew install git` — [git-scm.com/download/mac](https://git-scm.com/download/mac) |

### Download GitClaw (installers)

Prebuilt **Windows (.exe)**, **Linux (.deb, AppImage)**, and **macOS (.dmg)** are on GitHub Releases: **[github.com/Abhivera/gitclaw/releases/latest](https://github.com/Abhivera/gitclaw/releases/latest)**.

After downloading the `.deb` on Debian/Ubuntu: `sudo apt install ./gitclaw_*_amd64.deb` (from the directory that contains the file).

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
| `npm run package:mac` | `.dmg` and `.zip` (macOS) |
| `npm run package:win` | NSIS `.exe` (Windows) |
| `npm run package:linux` | `.AppImage` and `.deb` (Linux) |
| `npm run package` | Targets for the **current** platform |

**macOS:** Build the `.dmg` on a Mac (`npm run package:mac`). If Gatekeeper blocks an **unsigned** build, right-click the app → **Open** once, or allow it under **System Settings → Privacy & Security**. For distribution outside the Mac App Store, Apple recommends Developer ID signing and notarization (optional CI secrets).

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

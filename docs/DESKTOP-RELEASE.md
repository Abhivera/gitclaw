# Installable GitClaw

## What users install

| System | Architecture | Download |
| --- | --- | --- |
| Windows | x64 | `GitClaw-Setup-VERSION.exe` |
| macOS | Apple Silicon / arm64 | `GitClaw-VERSION-arm64.dmg` |
| macOS | Intel / x64 | `GitClaw-VERSION-x64.dmg` |
| Linux | x64 | `GitClaw-VERSION-x86_64.AppImage` or `GitClaw-VERSION-amd64.deb` |

The app contains Electron, its web server, migration engine and PostgreSQL. Users
do not install Node.js, npm, Docker or PostgreSQL. Application data stays in the
OS user-data directory. Run it as your normal desktop user, not as Linux root.

First launch initializes the local database and may take about a minute.
On Ubuntu/Debian, prefer the `.deb` so the package manager installs the desktop
entry and sandbox profile. AppImages require FUSE 2; Ubuntu 24.04 calls that
package `libfuse2t64` ([AppImage FUSE documentation](https://docs.appimage.org/user-guide/troubleshooting/fuse.html)).

For local reviews, choose an AI provider and its key, or a running local
OpenAI-compatible server and an installed model name. Choose **Local review**,
pick a source folder, inspect the included file list and AI destination, and
confirm that specific review. Git is not required. Source files are never
executed or modified. Common dependency/hidden/secret files, `.gitignore` entries,
symlinks, non-UTF-8 content and files exceeding the review budget are excluded.
The preview reports partial coverage and skipped files. Model access may need an
internet connection; a local model server can run on loopback.

Connected pull request reviews remain available under **Integrations**. Set up a
provider app and public webhook tunnel if you want automatic reviews from a git
host. Keep the app running so it can receive and process those events. Local
folder reviews need neither a git-host account nor a tunnel.

## Build locally

Use a native build machine for each OS/architecture:

```sh
npm ci
npm run desktop:build:next
npm ci --prefix desktop
npm run dist --prefix desktop
node desktop/scripts/smoke-desktop.mjs
```

On headless Linux run the last command with `xvfb-run -a`. Build output is in
`release/desktop/`. The smoke test starts the packaged app with a fresh isolated
data directory, initializes PostgreSQL, applies migrations, starts the local
server, verifies the sandboxed preload, and shuts it down. It does not send code
to an AI provider or reuse the user's application data.

## Build and publish every platform

The **Release Desktop** workflow builds Windows x64, Linux x64, macOS x64 and
macOS arm64 on separate native runners. Each job smoke-tests its packaged
runtime. The Linux job installs its `.deb` before testing, including the standard
sandbox profile. This prevents a macOS x64 installer from shipping ARM server/database
binaries. See [GitHub runner architectures](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job).

Run `workflow_dispatch` for unsigned preview artifacts. To publish unsigned
installers, enable **Publish unsigned installers as a GitHub Release**. This
explicit option publishes `vVERSION` at the selected commit, labels the release
unsigned, includes that status in the downloads manifest, and does not require
signing secrets. Windows/macOS may display security warnings; macOS builds are
not notarized. A matching `vVERSION`
tag publishes a GitHub Release only after every build and smoke test succeeds.
Update the root, desktop and CLI package versions and lockfiles together before
tagging. The pipeline also uploads `website-downloads` with installers,
`downloads.json` and `SHA256SUMS.txt`. Deploy that artifact's contents under the
website's `/downloads/` path to serve them from your own domain. GitHub Release
assets are used as the website's fallback when local downloads are absent.

## Signing required for public releases

Tagged Windows/macOS releases fail early if signing credentials are absent.
The manual unsigned publishing option above is available when signing is not wanted.
Configure these GitHub repository secrets before publishing:

| Secret | Purpose |
| --- | --- |
| `WIN_CSC_LINK` | Windows signing certificate (base64 PFX or supported secure certificate URL) |
| `WIN_CSC_KEY_PASSWORD` | Windows certificate password |
| `MAC_CSC_LINK` | Apple Developer ID signing certificate (base64 P12 or supported secure URL) |
| `MAC_CSC_KEY_PASSWORD` | Apple certificate password |
| `APPLE_ID` | Apple developer account |
| `APPLE_APP_SPECIFIC_PASSWORD` | Apple app-specific password for notarization |
| `APPLE_TEAM_ID` | Developer team ID |

The macOS release configuration enables Hardened Runtime and notarization when
credentials are present. See [electron-builder v26 notarization](https://www.electron.build/v26/docs/notarization/).
Windows signing does not by itself guarantee immediate SmartScreen reputation.
Certificates and Apple account credentials are not included in the app.

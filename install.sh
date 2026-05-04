#!/usr/bin/env bash
# GitClaw — fetch latest release and install (macOS / Linux).
# https://gitclaw.online · https://github.com/Abhivera/gitclaw
set -e

REPO_OWNER="Abhivera"
REPO_NAME="gitclaw"
API_URL="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"
UA="gitclaw-install-script/1.0"

die() {
  echo "gitclaw: $*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing '$1' — install it and try again"
}

fetch_json() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -H "Accept: application/vnd.github+json" -H "User-Agent: ${UA}" "$API_URL"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- --header="Accept: application/vnd.github+json" --user-agent="${UA}" "$API_URL"
  else
    die "need curl or wget to talk to GitHub"
  fi
}

pick_asset() {
  local json="$1"
  local want="$2"
  python3 - "$want" <<'PY' || die "need python3 to parse the GitHub API response"
import json, sys
want = sys.argv[1]
data = json.loads(sys.stdin.read())
assets = data.get("assets") or []
name_url = [(a["name"], a["browser_download_url"]) for a in assets if a.get("name") and a.get("browser_download_url")]
if not name_url:
    sys.exit(2)
# want: deb-amd64 | deb-arm64 | appimage | dmg
if want == "deb-amd64":
    for n, u in name_url:
        if n.endswith(".deb") and ("_amd64.deb" in n or "-amd64.deb" in n):
            print(u)
            raise SystemExit(0)
if want == "deb-arm64":
    for n, u in name_url:
        if n.endswith(".deb") and ("_arm64.deb" in n or "_aarch64.deb" in n or "-arm64.deb" in n):
            print(u)
            raise SystemExit(0)
if want == "appimage":
    for n, u in name_url:
        if n.endswith(".AppImage"):
            print(u)
            raise SystemExit(0)
if want == "dmg":
    for n, u in name_url:
        if n.endswith(".dmg"):
            print(u)
            raise SystemExit(0)
sys.exit(2)
PY
}

download() {
  local url="$1"
  local out="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fL --progress-bar -o "$out" -H "User-Agent: ${UA}" "$url"
  else
    wget -q --show-progress -O "$out" --user-agent="${UA}" "$url"
  fi
}

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
Darwin)
  need_cmd python3
  JSON="$(fetch_json)"
  URL="$(pick_asset "$JSON" dmg)" || die "no .dmg found in latest release (yet?)"
  DEST="${HOME}/Downloads/$(basename "$URL")"
  echo "gitclaw: downloading $(basename "$URL")"
  download "$URL" "$DEST"
  echo "gitclaw: opening installer — drag GitClaw into Applications if prompted."
  open "$DEST"
  ;;
Linux)
  need_cmd python3
  JSON="$(fetch_json)"
  URL=""
  if command -v apt-get >/dev/null 2>&1; then
    if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
      URL="$(pick_asset "$JSON" deb-arm64)" || true
    fi
    if [[ -z "$URL" ]]; then
      URL="$(pick_asset "$JSON" deb-amd64)" || true
    fi
    if [[ -n "$URL" ]]; then
      TMP="$(mktemp -t gitclawXXXXXX.deb)"
      trap 'rm -f "$TMP"' EXIT
      echo "gitclaw: downloading $(basename "$URL")"
      download "$URL" "$TMP"
      echo "gitclaw: installing .deb (sudo)"
      sudo apt-get install -y "$TMP"
      trap - EXIT
      rm -f "$TMP"
      echo "gitclaw: done. Launch GitClaw from your app menu."
      exit 0
    fi
  fi
  URL="$(pick_asset "$JSON" appimage)" || die "no .deb (apt) or .AppImage found for this Linux"
  DEST="${HOME}/Downloads/$(basename "$URL")"
  echo "gitclaw: downloading $(basename "$URL")"
  download "$URL" "$DEST"
  chmod +x "$DEST"
  echo "gitclaw: AppImage ready at:"
  echo "  $DEST"
  echo "gitclaw: run it with: \"$DEST\""
  ;;
MINGW* | MSYS*)
  die "on Windows, use PowerShell: irm https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/install.ps1 | iex"
  ;;
*)
  die "unsupported OS: $OS (try GitHub releases: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest)"
  ;;
esac

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, nativeImage } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function getIconCandidates() {
  const candidates = [];

  if (app.isPackaged) {
    candidates.push(
      path.join(process.resourcesPath, "app-icon.ico"),
      path.join(process.resourcesPath, "app-icon.png"),
    );
  }

  candidates.push(
    path.join(__dirname, "icons", "icon.ico"),
    path.join(__dirname, "icons", "icon.png"),
    path.join(__dirname, "..", "public", "favicon.ico"),
    path.join(__dirname, "..", "public", "white-icon-black-bg.png"),
  );

  return candidates;
}

export function getAppIconPath() {
  for (const candidate of getIconCandidates()) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  return path.join(__dirname, "..", "public", "favicon.ico");
}

export function loadAppIcon() {
  const iconPath = getAppIconPath();

  if (!fileExists(iconPath)) {
    return null;
  }

  const image = nativeImage.createFromPath(iconPath);
  return image.isEmpty() ? null : image;
}

export function loadTrayIcon() {
  const image = loadAppIcon();
  if (!image) {
    return null;
  }

  return image.resize({ width: 16, height: 16 });
}

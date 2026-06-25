import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getTrayIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "tray-icon.ico");
  }

  return path.join(__dirname, "..", "public", "favicon.ico");
}

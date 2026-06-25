import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

function getFirstRunPath() {
  return path.join(app.getPath("userData"), "first-run.json");
}

export function isFirstRunComplete() {
  try {
    const content = fs.readFileSync(getFirstRunPath(), "utf8");
    const data = JSON.parse(content);
    return data.firstRunComplete === true;
  } catch {
    return false;
  }
}

export function markFirstRunComplete() {
  const filePath = getFirstRunPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify({ firstRunComplete: true, completedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

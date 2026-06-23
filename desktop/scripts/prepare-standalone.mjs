/**
 * Copies assets required by the Next.js standalone server into
 * `.next/standalone` before packaging the desktop app.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const standaloneDir = path.join(root, ".next", "standalone");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing path required for desktop bundle: ${src}`);
  }

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sourcePath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(sourcePath, destPath);
      continue;
    }

    fs.copyFileSync(sourcePath, destPath);
  }
}

if (!fs.existsSync(standaloneDir)) {
  throw new Error(
    "`.next/standalone` not found. Run `npm run desktop:build:next` with DESKTOP_BUILD=1 first.",
  );
}

copyRecursive(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
copyRecursive(path.join(root, "public"), path.join(standaloneDir, "public"));
copyRecursive(path.join(root, "prisma"), path.join(standaloneDir, "prisma"));
copyRecursive(path.join(root, "lib", "generated"), path.join(standaloneDir, "lib", "generated"));
fs.copyFileSync(path.join(root, "prisma.config.ts"), path.join(standaloneDir, "prisma.config.ts"));

console.log(`[desktop] Standalone bundle prepared at ${standaloneDir}`);

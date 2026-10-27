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

/**
 * The Prisma CLI (used for `migrate deploy` at runtime) requires its full
 * dependency tree, which Next's file tracing does not include. Walk the
 * dependency graph from `prisma` and copy every package.
 */

function collectDependencyClosure(packageName, visited) {
  if (visited.has(packageName)) {
    return;
  }

  const packageDir = path.join(root, "node_modules", ...packageName.split("/"));
  if (!fs.existsSync(packageDir)) {
    // Optional or platform-specific dependency that npm did not install.
    return;
  }

  visited.add(packageName);
  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
  const dependencies = { ...pkg.dependencies, ...pkg.optionalDependencies };

  for (const dependency of Object.keys(dependencies)) {
    collectDependencyClosure(dependency, visited);
  }
}

function copyPrismaCli() {
  const packages = new Set();
  collectDependencyClosure("prisma", packages);

  for (const packageName of packages) {
    const segments = packageName.split("/");
    copyRecursive(
      path.join(root, "node_modules", ...segments),
      path.join(standaloneDir, "node_modules", ...segments),
    );
  }

  // Keep the build machine's schema engine. `migrate deploy` needs it on first
  // launch; removing it forces an engine download on the end user's machine.

  console.log(`[desktop] Copied Prisma CLI with ${packages.size} dependency packages`);
}

if (!fs.existsSync(standaloneDir)) {
  throw new Error(
    "`.next/standalone` not found. Run `npm run desktop:build:next` with DESKTOP_BUILD=1 first.",
  );
}

// `next build` copies local .env files into the standalone output. Never ship
// them — desktop and CLI launchers inject configuration at runtime instead.
for (const entry of fs.readdirSync(standaloneDir)) {
  if (entry === ".env" || entry.startsWith(".env.")) {
    fs.rmSync(path.join(standaloneDir, entry), { force: true });
    console.log(`[desktop] Removed ${entry} from standalone bundle`);
  }
}

copyRecursive(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
copyRecursive(path.join(root, "public"), path.join(standaloneDir, "public"));
copyRecursive(path.join(root, "prisma"), path.join(standaloneDir, "prisma"));
copyRecursive(path.join(root, "lib", "generated"), path.join(standaloneDir, "lib", "generated"));
fs.copyFileSync(path.join(root, "prisma.config.ts"), path.join(standaloneDir, "prisma.config.ts"));
copyPrismaCli();

console.log(`[desktop] Standalone bundle prepared at ${standaloneDir}`);

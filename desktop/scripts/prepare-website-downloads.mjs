/**
 * Copies desktop installers into `public/downloads/` and writes `downloads.json`
 * for serving from gitclaw.online (or any Next.js host).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const releaseDir = path.join(root, "release", "desktop");
const downloadsDir = path.join(root, "public", "downloads");

const ARTIFACT_RULES = [
  {
    key: "windows",
    test: (name) => /setup.*\.exe$/i.test(name) && !/blockmap/i.test(name),
  },
  {
    key: "macosArm64",
    test: (name) => /arm64\.dmg$/i.test(name),
  },
  {
    key: "macosX64",
    test: (name) => /x64\.dmg$/i.test(name),
  },
  {
    key: "linuxAppImage",
    test: (name) => name.endsWith(".AppImage"),
  },
  {
    key: "linuxDeb",
    test: (name) => name.endsWith(".deb"),
  },
];

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  return pkg.version;
}

function pickArtifacts(files) {
  /** @type {Record<string, string | undefined>} */
  const picked = {};

  for (const rule of ARTIFACT_RULES) {
    const match = files.find((name) => rule.test(name));
    if (match) {
      picked[rule.key] = match;
    }
  }

  return picked;
}

if (!fs.existsSync(releaseDir)) {
  throw new Error(
    "No desktop build output found. Run `npm run desktop:dist` first.",
  );
}

const version = readVersion();
const releaseFiles = fs
  .readdirSync(releaseDir)
  .filter((name) => fs.statSync(path.join(releaseDir, name)).isFile())
  .filter((name) => name.includes(`-${version}.`) || name.includes(`-${version}-`));

const artifacts = pickArtifacts(releaseFiles);
const copied = Object.values(artifacts).filter(Boolean);

if (copied.length === 0) {
  throw new Error(
    `No installer files matched in ${releaseDir}. Expected .exe, .dmg, .AppImage, or .deb artifacts.`,
  );
}

fs.mkdirSync(downloadsDir, { recursive: true });

for (const fileName of copied) {
  fs.copyFileSync(path.join(releaseDir, fileName), path.join(downloadsDir, fileName));
}

/** @type {Record<string, unknown>} */
const manifest = {
  version,
  tag: `v${version}`,
  publishedAt: new Date().toISOString().slice(0, 10),
  unsigned: process.env.GITCLAW_UNSIGNED_RELEASE === "1",
};

for (const [key, fileName] of Object.entries(artifacts)) {
  if (fileName) {
    manifest[key] = { name: fileName, file: fileName };
  }
}

fs.writeFileSync(
  path.join(downloadsDir, "downloads.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`[desktop] Website downloads prepared in ${downloadsDir}`);
for (const fileName of copied) {
  const sizeMb = (fs.statSync(path.join(downloadsDir, fileName)).size / (1024 * 1024)).toFixed(1);
  console.log(`  - ${fileName} (${sizeMb} MB)`);
}
console.log(`  - downloads.json`);

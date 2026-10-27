import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import ignore from "ignore";

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".cs", ".c", ".cpp", ".h", ".hpp", ".rb", ".php", ".swift", ".kt", ".sql", ".sh", ".ps1", ".html", ".css", ".scss", ".vue", ".svelte", ".yaml", ".yml", ".json", ".toml", ".xml"]);
const EXCLUDED = new Set([".git", "node_modules", "vendor", "dist", "build", "coverage", ".next", ".venv", "venv", "__pycache__", "target"]);
export const LOCAL_REVIEW_LIMITS = { files: 60, fileBytes: 24_000, totalBytes: 64_000, entries: 10_000 };

function sensitiveFile(filePath) {
  return /(?:secret|credential|private[-_]?key)/i.test(path.basename(filePath)) ||
    /(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock)$/.test(filePath);
}

/** Collect a bounded read-only snapshot. No Git commands, hooks or project scripts. */
export async function collectLocalSources(directory, limits = LOCAL_REVIEW_LIMITS) {
  const root = await fs.realpath(directory);
  const files = [];
  const skipped = [];
  let totalBytes = 0;
  let entries = 0;
  let truncated = false;
  const walk = async (folder, inheritedRules = []) => {
    if (entries >= limits.entries) { truncated = true; return; }
    const folderRelative = path.relative(root, folder).split(path.sep).join("/");
    const rules = [...inheritedRules];
    try {
      const ignorePath = path.join(folder, ".gitignore");
      const stat = await fs.lstat(ignorePath);
      if (stat.isFile() && !stat.isSymbolicLink() && stat.size <= 64_000) {
        rules.push({ base: folderRelative, matcher: ignore().add(await fs.readFile(ignorePath, "utf8")) });
      }
    } catch { /* Built-in exclusions still apply when there is no .gitignore. */ }
    const children = (await fs.readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const entry of children) {
      if (++entries > limits.entries) { truncated = true; return; }
      if (files.length >= limits.files || totalBytes >= limits.totalBytes) { truncated = true; return; }
      const absolute = path.join(folder, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (entry.isSymbolicLink()) { skipped.push({ filePath: relative, reason: "Symbolic link" }); continue; }
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;
      const isDirectory = entry.isDirectory();
      if (isDirectory && EXCLUDED.has(entry.name)) continue;
      if (rules.some(({ base, matcher }) => matcher.ignores(`${base ? relative.slice(base.length + 1) : relative}${isDirectory ? "/" : ""}`))) continue;
      if (isDirectory) { await walk(absolute, rules); continue; }
      if (!entry.isFile() || sensitiveFile(relative)) continue;
      if (!EXTENSIONS.has(path.extname(entry.name).toLowerCase()) && !["Dockerfile", "Makefile"].includes(entry.name)) continue;
      let handle;
      try {
        const resolved = path.relative(root, await fs.realpath(absolute));
        if (resolved === ".." || resolved.startsWith(`..${path.sep}`) || path.isAbsolute(resolved)) continue;
        handle = await fs.open(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size > limits.fileBytes) {
          skipped.push({ filePath: relative, reason: "File size limit" }); continue;
        }
        const buffer = Buffer.alloc(limits.fileBytes + 1);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        if (bytesRead > limits.fileBytes || totalBytes + bytesRead > limits.totalBytes) {
          skipped.push({ filePath: relative, reason: "Review size limit" }); truncated = true; continue;
        }
        const source = buffer.subarray(0, bytesRead).toString("utf8");
        if (source.includes("\0") || source.includes("\uFFFD")) {
          skipped.push({ filePath: relative, reason: "Binary or non-UTF-8 file" }); continue;
        }
        if (!source.trim()) continue;
        const lines = source.replace(/\r\n/g, "\n").split("\n");
        if (lines.at(-1) === "") lines.pop();
        files.push({ filePath: relative, patch: `@@ -0,0 +1,${lines.length} @@\n${lines.map((line) => `+${line}`).join("\n")}` });
        totalBytes += bytesRead;
      } catch {
        skipped.push({ filePath: relative, reason: "Could not safely read file" });
      } finally { await handle?.close(); }
    }
  };
  await walk(root);
  return { folderName: path.basename(root), files, totalBytes, skipped: skipped.slice(0, 100), truncated };
}

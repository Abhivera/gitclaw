import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const output = path.join(root, "release", "desktop");
const binary = process.argv[2] || (process.platform === "win32"
  ? path.join(output, "win-unpacked", "GitClaw.exe")
  : process.platform === "darwin"
    ? path.join(output, process.arch === "arm64" ? "mac-arm64" : "mac", "GitClaw.app", "Contents", "MacOS", "GitClaw")
    : path.join(output, "linux-unpacked", "gitclaw"));
if (!fs.existsSync(binary)) throw new Error(`Packaged app not found: ${binary}`);
const data = fs.mkdtempSync(path.join(output, "smoke-data-"));
const child = spawn(binary, ["--gitclaw-smoke-test"], {
  env: { ...process.env, GITCLAW_SMOKE_TEST_DATA_DIR: data },
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let passed = false;
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    const message = chunk.toString();
    if (message.includes("[desktop-smoke] PASS")) passed = true;
    process.stdout.write(message);
  });
}
const timeout = setTimeout(() => { child.kill(); process.exitCode = 1; }, 120_000);
child.on("error", (error) => { clearTimeout(timeout); console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => {
  clearTimeout(timeout);
  if (code !== 0 || !passed) {
    console.error(`Desktop smoke test failed (exit ${code}, passed=${passed}).`);
    process.exitCode = 1;
  }
});

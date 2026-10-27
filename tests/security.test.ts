import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeAdmin, hasAdminCredentials, isProtectedPath, isTrustedAdminOrigin } from "../lib/admin-auth";
import { AI_TRUST_POLICY, isSensitiveFile, prepareAiPrompt, redactSecrets, safeAiOutput } from "../features/ai/security";
import { parseDiff } from "../features/reviews/utils/parse-diff";
import { filterFindingsToDiff } from "../features/reviews/server/post-inline-review";
import { chunkPrFiles } from "../features/reviews/utils/chunk-code";
import { formatPrFilesForReview } from "../features/reviews/server/pr-files";
import { runStaticAnalysis } from "../features/static-analysis/server/run-static-analysis";
import { DEFAULT_GITCLAW_CONFIG } from "../features/config/types/gitclaw-config";
import { parseGitclawConfig } from "../features/config/server/parse-config";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { isExternalWebUrl, isLocalAppUrl, isTrustedDesktopSender } from "../desktop/security.mjs";

const password = "a-long-test-password:with-colons";
const env = { GITCLAW_ADMIN_PASSWORD: password };
const basic = (value: string) => new Headers({ authorization: `Basic ${Buffer.from(value).toString("base64")}` });

test("administration fails closed without valid credentials", () => {
  assert.equal(hasAdminCredentials({}), false);
  assert.equal(hasAdminCredentials({ GITCLAW_ADMIN_PASSWORD: "short" }), false);
  assert.equal(authorizeAdmin(basic(`admin:${password}`), {}), false);
  assert.equal(authorizeAdmin(new Headers(), env), false);
  assert.equal(authorizeAdmin(basic(`other:${password}`), env), false);
  assert.equal(authorizeAdmin(basic("admin:wrong"), env), false);
  assert.equal(authorizeAdmin(basic(`admin:${password}`), env), true);
});

test("desktop tokens work only in desktop mode", () => {
  const headers = new Headers({ "x-gitclaw-desktop-token": "temporary-token" });
  assert.equal(authorizeAdmin(headers, { GITCLAW_DESKTOP_TOKEN: "temporary-token" }), false);
  assert.equal(authorizeAdmin(headers, { GITCLAW_DESKTOP: "1", GITCLAW_DESKTOP_TOKEN: "temporary-token" }), true);
  assert.equal(authorizeAdmin(headers, { GITCLAW_DESKTOP: "1", GITCLAW_DESKTOP_TOKEN: "other-token" }), false);
});

test("dashboard, configuration and provider connections require authentication; webhooks remain public", () => {
  for (const path of ["/dashboard", "/dashboard/settings", "/api/dashboard/pull-requests/1/status", "/api/desktop/config", "/api/github/connect", "/api/gitlab/callback", "/api/bitbucket/callback"]) {
    assert.equal(isProtectedPath(path), true, path);
  }
  for (const path of ["/", "/quickstart", "/api/github/webhook", "/api/gitlab/webhook/id", "/api/bitbucket/webhook/id"]) {
    assert.equal(isProtectedPath(path), false, path);
  }
});

test("mutations reject missing, null and foreign origins", () => {
  const url = "http://127.0.0.1:13100/api/desktop/config";
  for (const origin of [undefined, "null", "https://evil.test", "http://127.0.0.1:13100.evil.test"]) {
    assert.equal(isTrustedAdminOrigin(new Request(url, { method: "PUT", headers: origin ? { origin } : {} }), "https://gitclaw.test"), false);
  }
  assert.equal(isTrustedAdminOrigin(new Request(url, { method: "PUT", headers: { origin: "http://127.0.0.1:13100" } })), true);
  assert.equal(isTrustedAdminOrigin(new Request(url, { method: "POST", headers: { origin: "https://gitclaw.test" } }), "https://gitclaw.test"), true);
});

test("the request boundary enforces authentication and origin checks while allowing webhooks", () => {
  const previous = { password: process.env.GITCLAW_ADMIN_PASSWORD, desktop: process.env.GITCLAW_DESKTOP };
  try {
    delete process.env.GITCLAW_ADMIN_PASSWORD;
    delete process.env.GITCLAW_DESKTOP;
    const url = "http://localhost:3000/api/desktop/config";
    assert.equal(proxy(new NextRequest(url)).status, 503);
    assert.equal(proxy(new NextRequest("http://localhost:3000/api/github/webhook", { method: "POST" })).status, 200);
    process.env.GITCLAW_ADMIN_PASSWORD = password;
    assert.equal(proxy(new NextRequest(url)).status, 401);
    assert.equal(proxy(new NextRequest(url, { headers: basic(`admin:${password}`) })).status, 200);
    assert.equal(proxy(new NextRequest(url, { method: "PUT", headers: basic(`admin:${password}`) })).status, 403);
    const headers = basic(`admin:${password}`);
    headers.set("origin", "http://localhost:3000");
    assert.equal(proxy(new NextRequest(url, { method: "PUT", headers })).status, 200);
  } finally {
    for (const [key, value] of [["GITCLAW_ADMIN_PASSWORD", previous.password], ["GITCLAW_DESKTOP", previous.desktop]]) {
      if (value === undefined) delete process.env[key!]; else process.env[key!] = value;
    }
  }
});

const patch = "@@ -10,3 +20,3 @@\n context\n-eval('removed')\n+eval('added')\n tail\n@@ -100,0 +150,1 @@\n+console.log('added')\n";
const files = [{ filePath: "src/app.ts", patch }];

test("diff parsing tracks additions, removals and context across hunks", () => {
  assert.deepEqual(parseDiff(patch).map(({ line, added }) => [line, added]), [[20, false], [21, true], [22, false], [150, true]]);
  assert.deepEqual(parseDiff("--- a/file\n+++ b/file\n@@ -1 +1 @@\n-old\n+new\n\\ No newline at end of file").map((entry) => entry.line), [1]);
  assert.deepEqual(parseDiff("@@ -1,1 +0,0 @@\n-deleted"), []);
  assert.deepEqual(parseDiff("not a diff\n+invalid"), []);
  assert.equal(parseDiff("@@ -0,0 +1,1 @@\n+valid\n+out-of-hunk").length, 1);
});

test("static analysis scans added lines and reports real right-side coordinates", () => {
  const findings = runStaticAnalysis(files, DEFAULT_GITCLAW_CONFIG).findings;
  assert.deepEqual(findings.filter((entry) => entry.message.includes("eval()")).map((entry) => entry.line), [21]);
  assert.deepEqual(findings.filter((entry) => entry.message.includes("console.log")).map((entry) => entry.line), [150]);
  assert.equal(runStaticAnalysis([{ filePath: "x.ts", patch: "@@ -1 +1 @@\n-eval('gone')\n+safe()" }], DEFAULT_GITCLAW_CONFIG).findings.length, 0);
});

test("findings reject fabricated files and lines, empty bodies and duplicate entries", () => {
  const valid = { file: "src/app.ts", line: 21, severity: "issue" as const, body: "Unsafe execution" };
  const findings = [valid, valid, { ...valid, line: 500 }, { ...valid, line: 21.5 }, { ...valid, file: "elsewhere.ts" }, { ...valid, body: " " }];
  assert.deepEqual(filterFindingsToDiff(findings, files), [valid]);
});

test("secret redaction covers credentials across all AI inputs and preserves line counts", () => {
  const secrets = ["ghp_" + "a".repeat(36), "sk-proj-" + "b".repeat(30), "AKIA" + "A".repeat(16)];
  const input = `${secrets.join("\n")}\nAPI_KEY=super-secret-value\nconst password = 'super-password';\npostgresql://user:db-password@db/test\n-----BEGIN PRIVATE KEY-----\nprivate-material\n-----END PRIVATE KEY-----`;
  const redacted = prepareAiPrompt(input);
  for (const value of [...secrets, "super-secret-value", "super-password", "db-password", "private-material"]) assert.equal(redacted.includes(value), false, value);
  assert.equal(input.split("\n").length, redacted.split("\n").length);
  assert.equal(redactSecrets("ordinary code"), "ordinary code");
  assert.equal(redactSecrets("const token = getToken();"), "const token = getToken();");
  const envLines = "+API_KEY=first-secret-value\n+AUTH_TOKEN=second-secret-value\n";
  assert.equal(redactSecrets(envLines), "+API_KEY=[REDACTED_SECRET]\n+AUTH_TOKEN=[REDACTED_SECRET]\n");
  const keyDiff = "+-----BEGIN PRIVATE KEY-----\n+private-material\n+-----END PRIVATE KEY-----";
  assert.ok(redactSecrets(keyDiff).split("\n").every((line) => line.startsWith("+")));
});

test("sensitive files never enter formatted diffs or review chunks", () => {
  for (const path of [".env", "app/.env.production", "id_rsa", "certs/service.pem", ".npmrc"]) assert.equal(isSensitiveFile(path), true);
  assert.equal(isSensitiveFile("src/environment.ts"), false);
  const sensitive = { filePath: ".env", patch: "@@ -0,0 +1 @@\n+TOKEN=do-not-send" };
  assert.equal(formatPrFilesForReview([sensitive]), "");
  assert.equal(chunkPrFiles(1, [sensitive]).length, 0);
});

test("chunks retain hunk headers and accurate line coordinates", () => {
  const largePatch = Array.from({ length: 100 }, (_, index) => `@@ -0,0 +${index + 1},1 @@\n+line${index}\n`).join("");
  const chunks = chunkPrFiles(1, [{ filePath: "file.ts", patch: largePatch }]);
  assert.ok(chunks.length > 1);
  assert.deepEqual(chunks.flatMap((chunk) => parseDiff(chunk.text).map((entry) => entry.line)), Array.from({ length: 100 }, (_, index) => index + 1));
});

test("oversized prompts fail visibly instead of silently truncating reviews", () => {
  assert.throws(() => prepareAiPrompt("x".repeat(100_001)), /limit/);
});

test("the shared AI policy marks indirect injection sources as untrusted", () => {
  assert.match(AI_TRUST_POLICY, /untrusted data/);
  assert.match(AI_TRUST_POLICY, /suppress security findings/);
  assert.match(safeAiOutput("![track](https://evil.test/secret)"), /image removed/);
});

test("malformed repository YAML safely falls back to defaults", () => {
  assert.deepEqual(parseGitclawConfig("reviews: [unterminated"), DEFAULT_GITCLAW_CONFIG);
});

test("the sandbox-compatible preload exposes only the intended desktop bridge", () => {
  let bridge: Record<string, unknown> = {};
  runInNewContext(readFileSync("desktop/preload.cjs", "utf8"), {
    process: { platform: "win32" },
    require: (name: string) => {
      assert.equal(name, "electron");
      return {
        contextBridge: { exposeInMainWorld: (name: string, value: Record<string, unknown>) => {
          assert.equal(name, "gitclawDesktop");
          bridge = value;
        } },
        ipcRenderer: { sendSync: () => "test-config-path", invoke: () => Promise.resolve() },
      };
    },
  });
  assert.equal(bridge.configPath, "test-config-path");
  assert.equal(typeof bridge.restartApp, "function");
  assert.equal("desktopToken" in bridge, false);
});

test("desktop privileges require the exact local origin, window and main frame", () => {
  const mainFrame = { url: "http://127.0.0.1:13100/dashboard" };
  const contents = { mainFrame };
  assert.equal(isTrustedDesktopSender({ sender: contents, senderFrame: mainFrame }, contents, 13100), true);
  assert.equal(isTrustedDesktopSender({ sender: {}, senderFrame: mainFrame }, contents, 13100), false);
  assert.equal(isTrustedDesktopSender({ sender: contents, senderFrame: { ...mainFrame } }, contents, 13100), false);
  mainFrame.url = "https://evil.test";
  assert.equal(isTrustedDesktopSender({ sender: contents, senderFrame: mainFrame }, contents, 13100), false);
  for (const url of ["http://127.0.0.1:13100.evil.test", "http://127.0.0.1:13101", "http://localhost.evil.test", "file:///tmp/test", "invalid"]) {
    assert.equal(isLocalAppUrl(url, 13100), false);
  }
  assert.equal(isExternalWebUrl("https://github.com"), true);
  assert.equal(isExternalWebUrl("javascript:alert(1)"), false);
  assert.equal(isExternalWebUrl("file:///tmp/test"), false);
});

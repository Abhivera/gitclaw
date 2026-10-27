import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { collectLocalSources, LOCAL_REVIEW_LIMITS } from "../desktop/local-files.mjs";
import { snapshotId } from "../features/local-reviews/server/consent";
import { localReviewInputSchema } from "../features/local-reviews/types";
import { resolvePlatformDownload } from "../features/marketing/lib/downloads";
import { validateAiStep } from "../features/setup/lib/desktop-config-fields";

async function removeFixture(folder: string) {
  const resolved = path.resolve(folder);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("gitclaw-"));
  await fs.rm(resolved, { recursive: true, force: true });
}

test("local snapshots exclude ignored, hidden, dependency, secret and binary files", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "gitclaw-local-"));
  try {
    await fs.mkdir(path.join(folder, "src"));
    await fs.mkdir(path.join(folder, "node_modules"));
    await fs.writeFile(path.join(folder, ".gitignore"), "ignored.ts\n");
    await fs.writeFile(path.join(folder, "ignored.ts"), "ignored");
    await fs.writeFile(path.join(folder, ".env"), "API_KEY=never-send-this");
    await fs.writeFile(path.join(folder, "credentials.json"), "secret");
    await fs.writeFile(path.join(folder, "node_modules", "dependency.js"), "dependency");
    await fs.writeFile(path.join(folder, "binary.py"), Buffer.from([0, 1, 2]));
    await fs.writeFile(path.join(folder, "src", "app.ts"), "const answer = 42;\n");
    const result = await collectLocalSources(folder);
    assert.deepEqual(result.files.map((file) => file.filePath), ["src/app.ts"]);
    assert.equal(result.files[0].patch, "@@ -0,0 +1,1 @@\n+const answer = 42;");
    assert.ok(result.skipped.some((file) => file.filePath === "binary.py"));
  } finally { await removeFixture(folder); }
});

test("local review reports bounded and partial coverage instead of reading oversized files", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "gitclaw-limits-"));
  try {
    await fs.writeFile(path.join(folder, "a.ts"), "a".repeat(100));
    await fs.writeFile(path.join(folder, "b.ts"), "b".repeat(100));
    await fs.writeFile(path.join(folder, "huge.ts"), "x".repeat(LOCAL_REVIEW_LIMITS.fileBytes + 1));
    const result = await collectLocalSources(folder, { ...LOCAL_REVIEW_LIMITS, files: 1 });
    assert.equal(result.files.length, 1);
    assert.equal(result.truncated, true);
    const full = await collectLocalSources(folder);
    assert.equal(full.files.length, 2);
    assert.ok(full.skipped.some((file) => file.filePath === "huge.ts"));
  } finally { await removeFixture(folder); }
});

test("confirmation binds the exact source snapshot and requires explicit consent", () => {
  const files = [{ filePath: "a.ts", patch: "@@ -0,0 +1,1 @@\n+const a = 1;" }];
  const id = snapshotId("project", files);
  assert.equal(id.length, 64);
  assert.notEqual(id, snapshotId("project", [{ ...files[0], patch: files[0].patch + "changed" }]));
  assert.equal(localReviewInputSchema.safeParse({ folderName: "project", files }).success, false);
  assert.equal(localReviewInputSchema.safeParse({ folderName: "project", files,
    consent: { confirmed: true, snapshotId: id, destinationId: "d".repeat(64) } }).success, true);
});

test("Mac downloads preserve explicit architecture and local models require a model name", () => {
  const release = { tag: "v1", htmlUrl: "https://example.test", source: "site" as const,
    macosArm64: { name: "arm.dmg", url: "https://example.test/arm.dmg" },
    macosX64: { name: "intel.dmg", url: "https://example.test/intel.dmg" } };
  assert.equal(resolvePlatformDownload(release, "macos-arm64")?.name, "arm.dmg");
  assert.equal(resolvePlatformDownload(release, "macos-x64")?.name, "intel.dmg");
  assert.ok(validateAiStep("ollama", { OPENAI_BASE_URL: "http://localhost:11434/v1" }, {}).GITCLAW_REVIEW_MODEL);
  assert.deepEqual(validateAiStep("ollama", { OPENAI_BASE_URL: "http://localhost:11434/v1", GITCLAW_REVIEW_MODEL: "installed-model" }, {}), {});
});

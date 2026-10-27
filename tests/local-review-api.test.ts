import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { snapshotId } from "../features/local-reviews/server/consent";

test("local review sends only a confirmed snapshot to its confirmed provider, with secrets redacted", async () => {
  const overrides = {
    APP_URL: "http://localhost:3000", DATABASE_URL: "postgresql://fixture:fixture@localhost:5432/fixture",
    GITCLAW_DESKTOP: "1", GITCLAW_ADMIN_PASSWORD: "fixture-admin-password-long-enough",
    AI_PROVIDER: "openai-compatible", OPENAI_BASE_URL: "http://127.0.0.1:11435/v1", GITCLAW_REVIEW_MODEL: "fixture-model",
  };
  const previous = Object.fromEntries(Object.keys(overrides).map((key) => [key, process.env[key]]));
  Object.assign(process.env, overrides);
  let modelCalls = 0;
  let modelInput = "";
  const fetchMock = mock.method(globalThis, "fetch", async (url: string | URL | Request, options?: RequestInit) => {
    assert.ok(String(url).startsWith("http://127.0.0.1:11435/v1/"), "must use the confirmed fixture endpoint");
    modelCalls++;
    modelInput = String(options?.body);
    return new Response(JSON.stringify({
      id: "fixture", object: "chat.completion", created: 1, model: "fixture-model",
      choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify({ summary: "Fixture review completed", findings: [{ file: "sample.ts", line: 1, severity: "issue", body: "Avoid hardcoded credentials." }] }) }, finish_reason: "stop" }],
      usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
    }), { headers: { "Content-Type": "application/json" } });
  });
  try {
    const { GET, POST } = await import("../app/api/desktop/local-review/route");
    const authorization = `Basic ${Buffer.from(`admin:${overrides.GITCLAW_ADMIN_PASSWORD}`).toString("base64")}`;
    const headers = { authorization, origin: overrides.APP_URL, "content-type": "application/json" };
    const destinationResponse = await GET(new Request(`${overrides.APP_URL}/api/desktop/local-review`, { headers }));
    assert.equal(destinationResponse.status, 200);
    const destination = await destinationResponse.json();
    const files = [{ filePath: "sample.ts", patch: "@@ -0,0 +1,1 @@\n+const API_KEY = 'fixture-secret-value';" }];
    const input = { folderName: "fixture-project", files, consent: {
      confirmed: true, snapshotId: snapshotId("fixture-project", files), destinationId: destination.id,
    } };
    const post = (payload: unknown) => POST(new Request(`${overrides.APP_URL}/api/desktop/local-review`, { method: "POST", headers, body: JSON.stringify(payload) }));
    assert.equal((await post({ ...input, consent: undefined })).status, 400);
    assert.equal((await post({ ...input, consent: { ...input.consent, confirmed: false } })).status, 400);
    assert.equal((await post({ ...input, consent: { ...input.consent, destinationId: "x".repeat(64) } })).status, 409);
    assert.equal((await post({ ...input, files: [{ ...files[0], patch: files[0].patch + "modified" }] })).status, 409);
    assert.equal(modelCalls, 0, "unconfirmed or changed inputs must not reach a model");
    const result = await post(input);
    assert.equal(result.status, 200);
    assert.equal((await result.json()).findings[0].file, "sample.ts");
    assert.equal(modelCalls, 1);
    assert.equal(modelInput.includes("fixture-secret-value"), false);
    assert.ok(modelInput.includes("[REDACTED_SECRET]"));
  } finally {
    fetchMock.mock.restore();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

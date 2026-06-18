export async function register() {
  // pg-boss relies on Node APIs, so only boot workers in the Node.js runtime.
  // Skip during `next build` so the build never tries to connect to Postgres.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { formatEnvSetupMessage, getEnvIssues, isCoreEnvConfigured } =
      await import("@/lib/env");

    if (!isCoreEnvConfigured()) {
      console.warn(
        `[gitclaw] running without full configuration — background workers disabled.\n${formatEnvSetupMessage(getEnvIssues())}`,
      );
      return;
    }

    const { startWorkers } = await import("@/features/jobs/worker");
    try {
      await startWorkers();
    } catch (error) {
      console.error("[gitclaw] failed to start background workers", error);
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }
  }
}

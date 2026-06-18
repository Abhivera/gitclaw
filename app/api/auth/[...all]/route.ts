import { auth } from "@/lib/auth";
import { formatEnvSetupMessage, getEnvIssues, isCoreEnvConfigured } from "@/lib/env";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

const handlers = toNextJsHandler(auth);

function configurationRequiredResponse() {
  return NextResponse.json(
    {
      error: "configuration_required",
      message: formatEnvSetupMessage(getEnvIssues()),
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!isCoreEnvConfigured()) {
    return configurationRequiredResponse();
  }

  try {
    return handlers.GET(request);
  } catch (error) {
    console.error("[gitclaw] auth GET failed", error);
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isCoreEnvConfigured()) {
    return configurationRequiredResponse();
  }

  try {
    return handlers.POST(request);
  } catch (error) {
    console.error("[gitclaw] auth POST failed", error);
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }
}

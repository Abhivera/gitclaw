import { NextResponse } from "next/server";
import {
  getDesktopConfigPath,
  isDesktopConfigApiAvailable,
  readDesktopConfigSnapshot,
  saveDesktopConfigFile,
} from "@/features/setup/lib/desktop-config-file";

export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json({ error: "Desktop configuration API is unavailable." }, { status: 404 });
}

export async function GET() {
  if (!isDesktopConfigApiAvailable()) {
    return unavailable();
  }

  try {
    const snapshot = readDesktopConfigSnapshot(getDesktopConfigPath());
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read configuration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isDesktopConfigApiAvailable()) {
    return unavailable();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a JSON object of configuration values." }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") {
      return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
    }
    updates[key] = value;
  }

  try {
    const result = saveDesktopConfigFile(getDesktopConfigPath(), updates);
    if (!result.success) {
      return NextResponse.json({ issues: result.issues }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save configuration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

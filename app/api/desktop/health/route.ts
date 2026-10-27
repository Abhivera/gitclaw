import { NextResponse } from "next/server";
import { isDesktopApp } from "@/features/setup/lib/is-desktop";
import { authorizeAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDesktopApp()) return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  if (!authorizeAdmin(request.headers)) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json({ service: "gitclaw", ready: true });
}

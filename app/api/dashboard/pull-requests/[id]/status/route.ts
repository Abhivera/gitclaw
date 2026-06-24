import { getPullRequestStatus } from "@/features/dashboard/server/queries";
import { ensureInstance } from "@/lib/instance";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await ensureInstance();
    const status = await getPullRequestStatus(id);

    if (!status) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
}

import { getServerSession } from "@/features/auth/actions";
import { getPullRequestStatus } from "@/features/dashboard/server/queries";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const status = await getPullRequestStatus(session.user.id, id);

  if (!status) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}

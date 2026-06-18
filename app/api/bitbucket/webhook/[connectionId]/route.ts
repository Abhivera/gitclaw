import { handleProviderWebhook } from "@/features/git-providers/server/webhook-handler";

type RouteContext = {
  params: Promise<{ connectionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { connectionId } = await context.params;
  return handleProviderWebhook("bitbucket", connectionId, request);
}

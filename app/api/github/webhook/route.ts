import { handleProviderWebhook } from "@/features/git-providers/server/webhook-handler";

export const POST = (request: Request) =>
  handleProviderWebhook("github", null, request);

import { DesktopWebhookAssistant } from "@/features/setup/components/desktop-webhook-assistant";
import { isDesktopApp, isWebhooksConfigured } from "@/features/setup/lib/desktop-setup";
import { getDesktopTunnelStatus } from "@/features/setup/lib/desktop-tunnel";

export function DesktopWebhooksBanner() {
  if (!isDesktopApp() || isWebhooksConfigured()) {
    return null;
  }

  return <DesktopWebhookAssistant status={getDesktopTunnelStatus()} variant="banner" />;
}

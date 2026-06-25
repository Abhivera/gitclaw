import { redirect } from "next/navigation";
import { DesktopSetup } from "@/features/setup/components/desktop-setup";
import {
  getDesktopSetupStatus,
  isDesktopApp,
  isDesktopSetupComplete,
} from "@/features/setup/lib/desktop-setup";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup · GitClaw",
};

export default function DesktopSetupPage() {
  if (!isDesktopApp()) {
    redirect(DASHBOARD_ROUTES.overview);
  }

  if (isDesktopSetupComplete()) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  return <DesktopSetup status={getDesktopSetupStatus()} />;
}

import { redirect } from "next/navigation";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import {
  DesktopConfigurationForm,
  DesktopConfigurationUnavailable,
} from "@/features/setup/components/desktop-configuration-form";
import {
  isDesktopApp,
  isDesktopSetupComplete,
} from "@/features/setup/lib/desktop-setup";
import { isDesktopConfigApiAvailable } from "@/features/setup/lib/desktop-config-file";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration · Settings",
};

export default function DesktopConfigurationPage() {
  if (!isDesktopApp()) {
    redirect("/dashboard/settings");
  }

  const configApiAvailable = isDesktopConfigApiAvailable();
  const showSetupBackLink = isDesktopApp() && !isDesktopSetupComplete();

  return (
    <>
      {showSetupBackLink ? (
        <div className="border-b border-border px-6 py-3">
          <Link
            href={DASHBOARD_ROUTES.setup}
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            ← Back to setup
          </Link>
        </div>
      ) : null}
      <DashboardHeader
        title="Configuration"
        description="Manage Git providers, AI keys, and advanced desktop settings without editing .env by hand."
      />
      <div className="flex flex-1 flex-col gap-6 p-6 pb-24">
        {configApiAvailable ? <DesktopConfigurationForm /> : <DesktopConfigurationUnavailable />}
      </div>
    </>
  );
}

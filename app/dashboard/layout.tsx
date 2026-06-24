import { ensureInstance } from "@/lib/instance";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { SetupRequired } from "@/features/setup/components/setup-required";
import { isCoreEnvConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCoreEnvConfigured()) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
        <div className="w-full max-w-lg">
          <SetupRequired />
        </div>
      </div>
    );
  }

  await ensureInstance();

  return <DashboardShell>{children}</DashboardShell>;
}

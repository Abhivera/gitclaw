"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === DASHBOARD_ROUTES.setup || pathname === DASHBOARD_ROUTES.configuration) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}

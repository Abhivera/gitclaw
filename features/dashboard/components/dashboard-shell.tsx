import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { UserMenuUser } from "@/features/auth/components/user-menu";

type DashboardShellProps = {
  children: React.ReactNode;
  user: UserMenuUser;
};

export function DashboardShell({
  children,
  user,
}: DashboardShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-none focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <DashboardSidebar user={user} />
        <SidebarInset id="main-content" className="min-h-svh">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

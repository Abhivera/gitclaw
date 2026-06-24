import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="GitClaw"
              render={
                <Link href={DASHBOARD_ROUTES.overview}>
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-none bg-sidebar">
                    <BrandLogo
                      alt="GitClaw logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </span>
                  <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">GitClaw</span>
                  </span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNav />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

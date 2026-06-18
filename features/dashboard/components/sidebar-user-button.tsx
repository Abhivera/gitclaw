"use client";


import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { UserMenu, UserMenuUser } from "@/features/auth/components/user-menu";

type SidebarUserButtonProps = {
  user: UserMenuUser;
};

export function SidebarUserButton({ user }: SidebarUserButtonProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserMenu
          user={user}
          variant="profile"
          className="w-full [&_button]:h-12 [&_button]:w-full [&_button]:justify-start [&_button]:gap-2 [&_button]:px-2"
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

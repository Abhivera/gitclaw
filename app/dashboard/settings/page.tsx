import { getSettingsData } from "@/features/dashboard/server/settings-queries";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { SlackWebhookForm } from "@/features/dashboard/components/slack-webhook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { isDesktopApp } from "@/features/setup/lib/desktop-setup";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings · Dashboard",
};

const SettingsPage = async () => {
  const { organization, members } = await getSettingsData();

  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Manage your workspace and notifications."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {isDesktopApp() ? (
          <Card>
            <CardHeader>
              <CardTitle>Environment configuration</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Manage Git providers, AI keys, and tunnel settings in a guided form.
              </p>
              <Button render={<Link href={DASHBOARD_ROUTES.configuration} />} nativeButton={false}>
                Open configuration
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span>{organization.slug}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between">
                  <span>
                    {member.user.name}{" "}
                    <span className="text-muted-foreground">
                      ({member.user.email})
                    </span>
                  </span>
                  <span className="capitalize text-muted-foreground">
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <SlackWebhookForm
          defaultValue={organization.slackWebhookUrl ?? ""}
        />
      </div>
    </>
  );
};

export default SettingsPage;

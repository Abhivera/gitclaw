import { requireAuth } from "@/features/auth/actions";
import { getSettingsData } from "@/features/dashboard/server/settings-queries";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { SlackWebhookForm } from "@/features/dashboard/components/slack-webhook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings · Dashboard",
};

const SettingsPage = async () => {
  const session = await requireAuth();
  const { organization, members } = await getSettingsData(session.user.id);

  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Manage your workspace and notifications."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
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

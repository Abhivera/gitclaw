import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <>
      <DashboardHeader title="Page not found" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              The page you requested does not exist or you do not have access to
              it.
            </p>
            <Link
              href={DASHBOARD_ROUTES.overview}
              className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              Back to overview
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

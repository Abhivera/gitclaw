import { redirect } from "next/navigation";
import { isDesktopApp } from "@/features/setup/lib/is-desktop";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LocalReview } from "@/features/local-reviews/components/local-review";

export default function LocalReviewPage() {
  if (!isDesktopApp()) redirect("/dashboard");
  return <>
    <DashboardHeader title="Review local code" description="Choose a source folder, preview the files, and confirm where to send your review." />
    <LocalReview />
  </>;
}

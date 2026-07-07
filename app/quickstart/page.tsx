import type { Metadata } from "next";
import { QuickstartPage } from "@/features/marketing/components/quickstart-page";
import { fetchLatestDownloads } from "@/features/marketing/lib/downloads.server";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Quickstart — GitClaw",
  description:
    "Step-by-step guide to install, configure, deploy, and connect GitClaw for automated AI pull request reviews.",
  alternates: {
    canonical: `${siteUrl}/quickstart`,
  },
  openGraph: {
    title: "GitClaw Quickstart",
    description:
      "Install GitClaw with Docker, manual setup, or the desktop app. Configure providers and run your first review.",
    url: `${siteUrl}/quickstart`,
  },
};

export default async function QuickstartRoute() {
  const initialRelease = await fetchLatestDownloads();

  return <QuickstartPage initialRelease={initialRelease} />;
}

import { redirect } from "next/navigation";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { LandingPage } from "@/features/marketing/components/landing-page";
import {
  landingJsonLd,
  landingMetadata,
} from "@/features/marketing/lib/metadata";
import { fetchLatestDownloads } from "@/features/marketing/lib/releases";
import { isCoreEnvConfigured } from "@/lib/env";

export const metadata = landingMetadata;

export default async function Home() {
  if (isCoreEnvConfigured()) {
    redirect(DASHBOARD_ROUTES.overview);
  }

  const release = await fetchLatestDownloads();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
      />
      <LandingPage initialRelease={release} />
    </>
  );
}

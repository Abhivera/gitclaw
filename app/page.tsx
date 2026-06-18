import { redirect } from "next/navigation";
import { getServerSession } from "@/features/auth/actions";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { LandingPage } from "@/features/marketing/components/landing-page";
import {
  landingJsonLd,
  landingMetadata,
} from "@/features/marketing/lib/metadata";
import { fetchLatestDownloads } from "@/features/marketing/lib/releases";

export const metadata = landingMetadata;

export default async function Home() {
  const session = await getServerSession();

  if (session) {
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

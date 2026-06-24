import { redirect } from "next/navigation";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { LandingPage } from "@/features/marketing/components/landing-page";
import {
  landingJsonLd,
  landingMetadata,
} from "@/features/marketing/lib/metadata";
import { isCoreEnvConfigured } from "@/lib/env";

export const metadata = landingMetadata;

export default function Home() {
  if (isCoreEnvConfigured()) {
    redirect(DASHBOARD_ROUTES.overview);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
      />
      <LandingPage />
    </>
  );
}

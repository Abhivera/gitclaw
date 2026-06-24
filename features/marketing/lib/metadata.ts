import type { Metadata } from "next";
import { brandMetadataIcons, brandOgImageUrl } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import { URLS } from "./releases";

const siteUrl = getSiteUrl();

export const landingMetadata: Metadata = {
  title: "GitClaw — Self-hosted AI code reviewer for GitHub, GitLab & Bitbucket",
  description:
    "GitClaw is an open-source, self-hosted AI reviewer that automatically analyzes pull requests and provides code-quality, security, performance, and maintainability feedback directly inside GitHub, GitLab, and Bitbucket. Download for Windows, Linux, and macOS.",
  keywords: [
    "AI code review",
    "pull request reviewer",
    "self-hosted",
    "CodeRabbit alternative",
    "GitHub PR review",
    "GitLab MR review",
    "Bitbucket PR review",
    "code quality",
    "security review",
    "open source",
    "GitClaw",
  ],
  authors: [{ name: "GitClaw" }],
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    siteName: "GitClaw",
    url: siteUrl,
    title: "GitClaw — Self-hosted AI code reviewer for pull requests",
    description:
      "Open-source AI reviewer for GitHub, GitLab, and Bitbucket. Automatic PR analysis with feedback on code quality, security, performance, and maintainability — on your own infrastructure.",
    images: [
      {
        url: brandOgImageUrl(siteUrl),
        alt: "GitClaw logo — self-hosted AI code reviewer",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitClaw — Self-hosted AI code reviewer",
    description:
      "Automatically analyze pull requests with AI. Code quality, security, performance, and maintainability feedback for GitHub, GitLab, and Bitbucket.",
    images: [brandOgImageUrl(siteUrl)],
  },
  icons: brandMetadataIcons,
  other: {
    "theme-color": "#070a0f",
  },
};

export const landingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GitClaw",
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "AI code review",
  operatingSystem: "Windows 10+, macOS, Linux",
  description:
    "Open-source, self-hosted AI reviewer that automatically analyzes pull requests and provides code-quality, security, performance, and maintainability feedback directly inside GitHub, GitLab, and Bitbucket.",
  url: siteUrl,
  downloadUrl: URLS.releasesLatest,
  codeRepository: URLS.repo,
  license: "https://opensource.org/licenses/MIT",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Automatic pull request analysis",
    "Inline review comments on GitHub, GitLab, and Bitbucket",
    "Code quality and security feedback",
    "Performance and maintainability insights",
    "PR chat via @gitclaw mentions",
    "Per-repo configuration with .gitclaw.yaml",
    "Dashboard with analytics and team management",
    "Self-hosted with pluggable AI providers",
    "Support for GitLab self-managed instances",
  ],
} as const;

import type { Metadata } from "next";
import { brandMetadataIcons, brandOgImageUrl } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import { URLS } from "./releases";

const siteUrl = getSiteUrl();

export const landingMetadata: Metadata = {
  title: "GitClaw | self-hosted AI code review",
  description:
    "GitClaw is an open-source, self-hosted AI code review robot and pull-request agent — a self-hosted alternative to SaaS review bots like CodeRabbit. It automatically analyzes pull requests and provides code-quality, security, performance, and maintainability feedback in GitHub, GitLab, and Bitbucket. Download for Windows, Linux, and macOS.",
  keywords: [
    "AI code review",
    "AI code review robot",
    "PR review bot",
    "code review bot",
    "AI review agent",
    "AI coding agent",
    "AI agent for pull requests",
    "pull request reviewer",
    "self-hosted",
    "GitHub PR review",
    "GitLab MR review",
    "Bitbucket PR review",
    "code quality",
    "security review",
    "open source",
    "CodeRabbit alternative",
    "CodeRabbit open source alternative",
    "self-hosted CodeRabbit alternative",
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
    title: "GitClaw | Self-hosted AI code review robot & agent",
    description:
      "Open-source AI review robot and pull-request agent for GitHub, GitLab, and Bitbucket. Self-hosted alternative to CodeRabbit with automatic PR analysis on your own infrastructure.",
    images: [
      {
        url: brandOgImageUrl(siteUrl),
        alt: "GitClaw",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitClaw | Self-hosted AI code review robot & agent",
    description:
      "Open-source AI review robot and agent for pull requests. Self-hosted CodeRabbit alternative with code quality, security, performance, and maintainability feedback.",
    images: [brandOgImageUrl(siteUrl)],
  },
  icons: brandMetadataIcons,
  other: {
    "theme-color": "#0A0A0A",
  },
};

export const landingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GitClaw",
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "AI code review robot",
  operatingSystem: "Windows 10+, macOS, Linux",
  description:
    "Open-source, self-hosted AI code review robot and pull-request agent — a self-hosted alternative to SaaS review bots like CodeRabbit. Automatically analyzes pull requests and provides code-quality, security, performance, and maintainability feedback directly inside GitHub, GitLab, and Bitbucket.",
  keywords:
    "AI code review robot, PR review bot, AI agent, CodeRabbit alternative, CodeRabbit open source alternative, self-hosted, open source, GitHub, GitLab, Bitbucket",
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
    "AI pull-request agent with automatic review on open and update",
    "Self-hosted open-source alternative to CodeRabbit",
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

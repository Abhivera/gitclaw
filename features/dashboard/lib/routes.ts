export const DASHBOARD_ROUTES = {
  overview: "/dashboard",
  setup: "/dashboard/setup",
  repos: "/dashboard/repos",
  pullRequest: "/dashboard/pull-request",
  analytics: "/dashboard/analytics",
  integrations: "/dashboard/integrations",
  settings: "/dashboard/settings",
  configuration: "/dashboard/settings/configuration",
} as const;

export type DashboardRoute =
  (typeof DASHBOARD_ROUTES)[keyof typeof DASHBOARD_ROUTES];

export const DASHBOARD_NAV_ITEMS = [
  {
    title: "Overview",
    href: DASHBOARD_ROUTES.overview,
    icon: "layout-dashboard" as const,
  },
  {
    title: "Repositories",
    href: DASHBOARD_ROUTES.repos,
    icon: "folder-git-2" as const,
  },
  {
    title: "Pull requests",
    href: DASHBOARD_ROUTES.pullRequest,
    icon: "git-pull-request" as const,
  },
  {
    title: "Analytics",
    href: DASHBOARD_ROUTES.analytics,
    icon: "chart-bar" as const,
  },
  {
    title: "Integrations",
    href: DASHBOARD_ROUTES.integrations,
    icon: "integrations" as const,
  },
  {
    title: "Settings",
    href: DASHBOARD_ROUTES.settings,
    icon: "settings" as const,
  },
] as const;

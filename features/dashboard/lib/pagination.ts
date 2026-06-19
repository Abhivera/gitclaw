export const DASHBOARD_PAGE_SIZE = 25;

export function parsePageParam(value?: string): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getPaginationMeta(total: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(total / DASHBOARD_PAGE_SIZE));

  return {
    page: Math.min(page, totalPages),
    pageSize: DASHBOARD_PAGE_SIZE,
    total,
    totalPages,
    skip: (Math.min(page, totalPages) - 1) * DASHBOARD_PAGE_SIZE,
  };
}

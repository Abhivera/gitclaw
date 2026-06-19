"use client";

import { Button } from "@/components/ui/button";
import { DASHBOARD_PAGE_SIZE } from "@/features/dashboard/lib/pagination";
import { cn } from "@/lib/utils";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { Route } from "next";
import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  basePath: Route;
  searchParams?: Record<string, string | undefined>;
  className?: string;
};

function buildPageHref(
  basePath: Route,
  page: number,
  searchParams?: Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  total,
  basePath,
  searchParams,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * DASHBOARD_PAGE_SIZE + 1;
  const end = Math.min(page * DASHBOARD_PAGE_SIZE, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          nativeButton={false}
          render={
            page > 1 ? (
              <Link
                href={buildPageHref(basePath, page - 1, searchParams) as Route}
              />
            ) : undefined
          }
        >
          <CaretLeftIcon className="size-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          nativeButton={false}
          render={
            page < totalPages ? (
              <Link
                href={buildPageHref(basePath, page + 1, searchParams) as Route}
              />
            ) : undefined
          }
        >
          Next
          <CaretRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: {
    label: string;
    href: Route;
  };
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {icon ? (
        <div className="mb-4 text-muted-foreground">{icon}</div>
      ) : null}
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

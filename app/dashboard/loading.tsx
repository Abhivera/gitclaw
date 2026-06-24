import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <DashboardHeader title="Loading…" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </>
  );
}

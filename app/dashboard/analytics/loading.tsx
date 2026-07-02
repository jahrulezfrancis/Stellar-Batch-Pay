import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-8 space-y-8" aria-label="Loading analytics">
      <div className="space-y-2">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

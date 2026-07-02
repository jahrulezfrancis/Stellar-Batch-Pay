import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-8 space-y-6" aria-label="Loading settings">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-56 w-full lg:col-span-2 rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>

      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

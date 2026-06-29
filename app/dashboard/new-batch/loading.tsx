import { Skeleton } from "@/components/ui/skeleton";

export default function NewBatchLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-8 space-y-6" aria-label="Loading new batch">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-[34rem] max-w-full" />
      </div>

      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-20 hidden sm:block" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-72" />
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-44 w-full rounded-lg" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-56" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

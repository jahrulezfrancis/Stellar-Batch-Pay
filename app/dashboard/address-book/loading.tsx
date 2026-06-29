import { Skeleton } from "@/components/ui/skeleton";

export default function AddressBookLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-8 space-y-6" aria-label="Loading address book">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-[32rem] max-w-full" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Skeleton className="h-10 w-full md:w-80" />
          <Skeleton className="h-10 w-full md:w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 py-2">
              <Skeleton className="h-10 w-full md:col-span-2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="h-[calc(100vh-5rem)] flex">
      <aside className="w-full md:w-1/3 border-r p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-2 rounded-lg">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main className="hidden md:flex w-2/3 items-center justify-center">
        <p className="text-muted-foreground">Loading trades...</p>
      </main>
    </div>
  );
}

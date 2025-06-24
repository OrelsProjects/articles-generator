import { Skeleton } from "@/components/ui/skeleton";

export default function KanbanLoading() {
  return (
  <div className="w-full">
    <div className="max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Draft Column */}
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex flex-col flex-1 rounded-lg p-2 min-h-[300px] bg-gray-200/15 dark:bg-gray-500/20">
          <div className="flex flex-col gap-2 flex-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-lg p-3 shadow-sm border"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduled Column */}
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex flex-col flex-1 rounded-lg p-2 min-h-[300px] bg-amber-100/20 dark:bg-amber-500/20">
          <div className="flex flex-col gap-2 flex-1">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-lg p-3 shadow-sm border"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Published Column */}
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex flex-col flex-1 bg-muted/30 rounded-lg p-2 min-h-[300px]  dark:bg-green-500/20 opacity-70">
          <div className="flex flex-col gap-2 flex-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-lg p-3 shadow-sm border"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

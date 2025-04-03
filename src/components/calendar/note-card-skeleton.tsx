"use client";

import { cn } from "@/lib/utils";

interface NoteCardSkeletonProps {
  className?: string;
}

export function NoteCardSkeleton({ className }: NoteCardSkeletonProps) {
  return (
    <div
      className={cn(
        "p-2 rounded-lg shadow-sm border-2 border-dashed border-primary/20",
        "animate-pulse bg-muted/50",
        className,
      )}
    >
      <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2" />
      <div className="h-3 w-1/2 bg-muted-foreground/20 rounded" />
    </div>
  );
}

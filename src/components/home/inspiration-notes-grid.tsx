"use client";

import React, { useState } from "react";
import {
  InspirationSortType,
  Note,
  InspirationSort,
  InspirationSortDirection,
  inspirationSortTypeToName,
} from "@/types/note";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Info,
  X,
  Calendar,
  MessageSquare,
  Repeat,
  Heart,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  Construction,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useInspiration } from "@/lib/hooks/useInspiration";
import { InspirationFilterDialog } from "@/components/ui/inspiration-filter/inspiration-filter-dialog";
import { useUi } from "@/lib/hooks/useUi";
import { Badge } from "@/components/ui/badge";
import { InspirationFilters } from "@/types/note";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import InspirationNoteComponent from "@/components/ui/inspiration-note-component";


// New component to display active filters
const ActiveFilters = ({
  filters,
  updateFilters,
}: {
  filters: InspirationFilters;
  updateFilters: (filters?: Partial<InspirationFilters>) => void;
}) => {
  const clearFilter = (key: keyof InspirationFilters) => {
    const newFilters = { ...filters };
    if (key === "dateRange") {
      newFilters.dateRange = undefined;
    } else {
      // If it's a number, set it to 0.
      // if it's a string, set it to "",
      // if it's a boolean, set it to false.
      if (typeof newFilters[key] === "number") {
        (newFilters as any)[key] = 0;
      } else if (typeof newFilters[key] === "string") {
        (newFilters as any)[key] = "";
      } else if (typeof newFilters[key] === "boolean") {
        (newFilters as any)[key] = false;
      }
    }
    updateFilters(newFilters);
  };

  const formatDateRange = (range?: DateRange) => {
    if (!range) return "";
    if (range.from && range.to) {
      return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`;
    }
    if (range.from) {
      return `Since ${format(range.from, "MMM d, yyyy")}`;
    }
    return "";
  };

  const hasActiveFilters =
    filters.keyword ||
    filters.dateRange ||
    (filters.minLikes && filters.minLikes > 0) ||
    (filters.minComments && filters.minComments > 0) ||
    (filters.minRestacks && filters.minRestacks > 0);

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground mr-1">
        Active filters:
      </span>

      {filters.keyword && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pl-3 pr-1.5 py-1"
        >
          <span>{filters.keyword}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => clearFilter("keyword")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {filters.dateRange && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pl-3 pr-1.5 py-1"
        >
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formatDateRange(filters.dateRange)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => clearFilter("dateRange")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {(filters.minLikes || 0) > 0 && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pl-3 pr-1.5 py-1"
        >
          <Heart className="h-3 w-3 mr-1" />
          <span>Min {filters.minLikes} likes</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => clearFilter("minLikes")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {(filters.minComments || 0) > 0 && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pl-3 pr-1.5 py-1"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          <span>Min {filters.minComments} comments</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => clearFilter("minComments")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {(filters.minRestacks || 0) > 0 && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pl-3 pr-1.5 py-1"
        >
          <Repeat className="h-3 w-3 mr-1" />
          <span>Min {filters.minRestacks} restacks</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => clearFilter("minRestacks")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() =>
          updateFilters({
            keyword: "",
            dateRange: undefined,
            minLikes: 0,
            minComments: 0,
            minRestacks: 0,
            type: "all",
          })
        }
      >
        Clear all
      </Button>
    </div>
  );
};

const SortButton = ({
  sort,
  updateSort,
}: {
  sort: InspirationSort;
  updateSort: (sort: InspirationSort) => void;
}) =>
  sort.type !== "relevance" && (
    <TooltipButton
      variant="outline"
      size="icon"
      tooltipContent={`Sort ${sort.direction === "asc" ? "ascending" : "descending"}`}
      className="text-muted-foreground flex"
      onClick={() => {
        const newDirection: InspirationSortDirection =
          sort.direction === "asc" ? "desc" : "asc";
        const newSort: InspirationSort = {
          type: sort.type,
          direction: newDirection,
        };
        updateSort(newSort);
      }}
    >
      {sort.direction === "asc" ? (
        <ArrowUpNarrowWide
          className={cn("h-4 w-4", {
            "text-primary": sort.direction === "asc",
          })}
        />
      ) : (
        <ArrowDownNarrowWide
          className={cn("h-4 w-4", {
            "text-primary": sort.direction === "desc",
          })}
        />
      )}
    </TooltipButton>
  );

export default function InspirationGrid() {
  const {
    notes,
    loading,
    error,
    filters,
    updateFilters,
    hasMore,
    loadMore,
    fetchInspirationNotes,
    hasMoreInspirationNotes,
    sort,
    updateSort,
    construction,
  } = useInspiration();
  const { hasAdvancedFiltering, hasViewWriter } = useUi();
  const [loadingMore, setLoadingMore] = useState(false);

  if (error) {
    toast.error(error);
  }

  const shouldShowError = error && !notes.length;
  const shouldShowLoading = loading && !notes.length;

  const hasFilters =
    filters.keyword ||
    filters.dateRange ||
    filters.minComments ||
    filters.minRestacks ||
    filters.minLikes;

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMore();
    } catch (err) {
      toast.error("Failed to load more notes");
    } finally {
      setLoadingMore(false);
    }
  };

  const Loading = () => (
    <div className="w-full mx-auto py-2 md:py-6 z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col space-y-3 rounded-xl border p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex space-x-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const Error = () => (
    <div className="container mx-auto py-12 text-center bg-background min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-foreground">
        Something went wrong
      </h1>
      <p className="text-red-500">{error}</p>
      <Button onClick={() => fetchInspirationNotes()}>Try Again</Button>
    </div>
  );

  // Transform notes into the format expected by MasonryGrid
  const gridCards = notes.map((note: Note) => {
    return {
      id: parseInt(note.id),
      className: "col-span-1",
      content: (
        <InspirationNoteComponent
          note={note}
          options={{ allowAuthorClick: hasViewWriter }}
        />
      ),
    };
  });

  return (
    <div className="w-full min-h-screen bg-transparent py-8 pb-28 md:py-16 flex justify-center items-start">
      <div className="feature-layout-container">
        <div className="mb-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-1">
            <div className="flex items-center mb-6 md:mb-1">
              <h2 className="text-xl md:text-3xl font-semibold text-foreground">
                Inspirations
              </h2>
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 mt-1 hidden md:flex"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      These notes were selected by our AI engine based on your
                      publications and notes.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="w-full flex items-center justify-between md:justify-end gap-2 overflow-x-auto">
              <Select
                value={sort.type}
                onValueChange={value => {
                  const newSort: InspirationSort = {
                    type: value as InspirationSortType,
                    direction: sort.direction,
                  };
                  updateSort(newSort);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">
                    {inspirationSortTypeToName.relevance}
                  </SelectItem>
                  <SelectItem value="date">
                    {inspirationSortTypeToName.date}
                  </SelectItem>
                  <SelectItem value="likes">
                    {inspirationSortTypeToName.likes}
                  </SelectItem>
                  <SelectItem value="comments">
                    {inspirationSortTypeToName.comments}
                  </SelectItem>
                  <SelectItem value="restacks">
                    {inspirationSortTypeToName.restacks}
                  </SelectItem>
                </SelectContent>
              </Select>
              {hasAdvancedFiltering && (
                <InspirationFilterDialog
                  filters={filters}
                  onFilterChange={updateFilters}
                  loading={loading}
                />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">
            Use these high-performing posts as inspirations for your next
            content! Our AI engine selected these for you.
          </p>
        </div>

        {/* Display active filters */}
        <div
          className={cn("w-full flex justify-end", {
            "justify-between": hasFilters,
          })}
        >
          {hasAdvancedFiltering && (
            <ActiveFilters filters={filters} updateFilters={updateFilters} />
          )}
          <SortButton sort={sort} updateSort={updateSort} />
        </div>

        {shouldShowLoading ? (
          <Loading />
        ) : shouldShowError ? (
          <Error />
        ) : construction ? (
          <div className="w-full text-center max-w-md p-8 rounded-xl border border-primary/20 shadow-sm bg-card mx-auto mt-10">
            <div className="flex justify-center mb-4">
              <Construction className="h-12 w-12 text-primary animate-bounce" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-foreground">
              Under Construction
            </h2>
            <p className="text-muted-foreground mb-2">
              We&apos;re building something wonderful for you!
            </p>
            <p className="text-muted-foreground text-sm">
              Please check back soon to see the magic unfold ✨
            </p>
          </div>
        ) : (
          <ScrollArea className="mx-auto py-6">
            {notes.length > 0 ? (
              <div className="w-full">
                <MasonryGrid cards={gridCards} />
                {loadingMore && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col space-y-3 rounded-xl border p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="mt-2 flex items-center justify-between">
                          <Skeleton className="h-6 w-16 rounded-md" />
                          <div className="flex space-x-1">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loadingMore &&
                  (hasMoreInspirationNotes && hasAdvancedFiltering ? (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-primary hover:text-primary/80"
                      >
                        {loadingMore ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        )}
                        More
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center mt-8">
                      <span className="text-muted-foreground">
                        You&apos;ve reached the end of the inspiration notes.
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3 className="text-2xl font-medium mb-4 text-foreground">
                  No notes found
                </h3>
                <p className="text-muted-foreground mb-8">
                  {hasFilters
                    ? "Try changing the filters to find more notes"
                    : "Something probably went wrong. Try again."}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => fetchInspirationNotes()}
                  className="px-6 py-3 bg-primary text-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try again
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

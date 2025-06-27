"use client";

import React, { useEffect } from "react";
import {
  ChevronDown,
  RefreshCw,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MousePointer,
  Users,
  Heart,
  MessageCircle,
  CoinsIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { UserWriterWithData } from "@/types/writer";
import { CompactNoteComponent } from "@/components/stats/compact-note-component";
import {
  OrderByNotesEngagement,
  OrderByNotesEngagementEnum,
} from "@/types/notes-stats";
import { toast } from "react-toastify";
import { useNotes } from "@/lib/hooks/useNotes";
import useMediaQuery from "@/lib/hooks/useMediaQuery";

interface UserWriterProfileProps {
  writer?: UserWriterWithData | null;
  isLoading: boolean;
  fetchNextPage: () => void;
  hasMore: boolean;
  error: Error | null;
  isLoadingMore: boolean;
  updateOrderBy: (orderBy: OrderByNotesEngagement) => void;
  updateOrderDirection: (orderDirection: "asc" | "desc") => void;
  orderBy: OrderByNotesEngagement;
  orderDirection: "asc" | "desc";
  isLoadingOrderBy: boolean;
  isLoadingOrderDirection: boolean;
}

const LoadingNotes = () => (
  <div className="min-h-screen bg-background">
    <div className={cn("bg-card shadow", {})}>
      <div className={cn("max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8", {})}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
          <div className="text-center sm:text-left w-full space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Sort Controls Skeleton */}
        <div className="sort-controls mb-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Skeleton className="h-4 w-16 mr-2" />
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-20" />
            ))}
            <div className="w-px h-6 bg-border/50" />
            <Skeleton className="h-9 w-12" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function UserWriterProfile({
  writer,
  isLoading,
  fetchNextPage,
  hasMore,
  error,
  isLoadingMore,
  updateOrderBy,
  updateOrderDirection,
  orderBy,
  orderDirection,
  isLoadingOrderBy,
  isLoadingOrderDirection,
}: UserWriterProfileProps) {
  const isMobileOrTablet = useMediaQuery("(max-width: 1024px)");
  const { selectNote } = useNotes();

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  if (isMobileOrTablet) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center text-foreground px-4">
        This feature is not available on mobile or tablet. Try it on your
        desktop 😊.
      </div>
    );
  }

  if (isLoading || (!writer && !error)) {
    return <LoadingNotes />;
  }

  if (!writer) {
    return (
      <div className="text-center text-destructive">
        {error?.message || "Writer not found"}
      </div>
    );
  }

  const noteCards = writer.topNotes.map(note => ({
    id: note.id,
    content: (
      <CompactNoteComponent
        note={note}
        loading={false}
        className="w-full max-h-48"
        onNoteClick={noteDraft => {
          if (noteDraft) {
            selectNote({
              ...noteDraft,
              authorId: Number(writer.authorId),
            });
          }
        }}
      />
    ),
  }));

  return (
    <div className="h-screen bg-background">
      {/* Header/Profile Section */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={writer.photoUrl}
              alt={writer.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
            />
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-foreground">
                  {writer.name}
                  <span className="text-muted-foreground ml-2">(You)</span>
                </h1>
                {writer.handle && (
                  <TooltipButton
                    variant="ghost-hover"
                    size="icon"
                    tooltipContent="View on Substack"
                    onClick={() => {
                      window.open(
                        `https://substack.com/@${writer.handle}`,
                        "_blank",
                      );
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </TooltipButton>
                )}
              </div>
              <p className="text-muted-foreground">@{writer.handle}</p>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                {writer.bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="h-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Modern Sorting Controls */}
        <div className="sort-controls mb-6">
          {/* Sort Metrics */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-2">
              Sort by
            </span>
            {[
              {
                key: OrderByNotesEngagementEnum.totalClicks,
                label: "Clicks",
                icon: <MousePointer className="h-3.5 w-3.5" />,
              },
              {
                key: OrderByNotesEngagementEnum.totalFreeSubscriptions,
                label: "Free Subs",
                icon: <Users className="h-3.5 w-3.5" />,
              },
              {
                key: OrderByNotesEngagementEnum.totalPaidSubscriptions,
                label: "Paid Subs",
                icon: <CoinsIcon className="h-3.5 w-3.5" />,
              },
              {
                key: OrderByNotesEngagementEnum.reactionCount,
                label: "Likes",
                icon: <Heart className="h-3.5 w-3.5" />,
              },
              {
                key: OrderByNotesEngagementEnum.commentsCount,
                label: "Comments",
                icon: <MessageCircle className="h-3.5 w-3.5" />,
              },
              {
                key: OrderByNotesEngagementEnum.restacks,
                label: "Restacks",
                icon: <RefreshCw className="h-3.5 w-3.5" />,
              },
            ].map(metric => (
              <Button
                key={metric.key}
                onClick={() => updateOrderBy(metric.key)}
                disabled={isLoadingOrderBy || isLoadingOrderDirection}
                variant={orderBy === metric.key ? "outline-primary" : "ghost"}
                className="gap-2 bg-transparent"
              >
                {isLoadingOrderBy && orderBy === metric.key ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  metric.icon
                )}
                {metric.label}
              </Button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border/50" />

          {/* Sort Direction */}
          <Button
            onClick={() =>
              updateOrderDirection(orderDirection === "asc" ? "desc" : "asc")
            }
            disabled={isLoadingOrderBy || isLoadingOrderDirection}
            title={orderDirection === "desc" ? "Descending" : "Ascending"}
            className="gap-2 bg-transparent"
            variant={orderDirection === "desc" ? "outline-primary" : "ghost"}
          >
            {isLoadingOrderDirection ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp
                className={cn("h-4 w-4", {
                  "rotate-180": orderDirection === "desc",
                })}
              />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {noteCards.map(note => (
            <div key={note.id}>{note.content}</div>
          ))}
        </div>

        {isLoadingMore && <LoadingNotes />}
        {hasMore && (
          <div className="w-full flex justify-center mt-4 pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchNextPage}
              disabled={isLoading || isLoadingMore}
              className="text-primary hover:text-primary/80"
            >
              More
              {isLoadingMore ? (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

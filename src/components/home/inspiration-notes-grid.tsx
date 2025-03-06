"use client";

import React, { useEffect, useState } from "react";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { useNotes } from "@/lib/hooks/useNotes";
import { Note } from "@/types/note";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "react-toastify";
import NoteComponent from "@/components/ui/note-component";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Info, Edit, RefreshCw, Plus, ChevronDown, Loader2 } from "lucide-react";

export default function InspirationGrid() {
  const {
    loadingInspiration: loading,
    error,
    fetchNotes,
    inspirationNotes: notes,
    hasMoreInspirationNotes,
    loadMoreInspirationNotes,
  } = useNotes();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const shouldShowError = error && !notes.length;
  const shouldShowLoading = loading && !notes.length;

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMoreInspirationNotes();
    } catch (err) {
      toast.error("Failed to load more notes");
    } finally {
      setLoadingMore(false);
    }
  };

  const Loading = () => (
    <div className="container mx-auto py-12 bg-background min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-64 w-full rounded-xl bg-background/80"
          />
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
      <button
        className="mt-4 px-4 py-2 bg-primary text-foreground rounded-md"
        onClick={() => fetchNotes()}
      >
        Try Again
      </button>
    </div>
  );

  // Transform notes into the format expected by MasonryGrid
  const gridCards = notes.map((note: Note) => {
    return {
      id: parseInt(note.id),
      className: "col-span-1",
      content: <NoteComponent note={note} />,
    };
  });

  return (
    <div className="w-full min-h-screen bg-transparent py-8">
      <div className="mb-6 container mx-auto">
        <div className="flex items-center mb-1">
          <h1 className="text-xl font-semibold text-foreground">
            Note inspirations
          </h1>
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 mt-1">
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
        <p className="text-sm text-muted-foreground">
          Use these high-performing posts as inspirations for your next content!
          Our AI engine selected these for you.
        </p>
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="ghost"
            className="text-sm flex items-center gap-2 px-0 font-black text-foreground underline underline-offset-2"
          >
            <Edit className="h-4 w-4" />
            Edit my personalized feed
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotes()}
            disabled={loading}
            className="text-sm flex items-center gap-2 rounded-md bg-gradient-to-b from-primary via-primary/80 to-primary/60 text-primary-foreground shadow-md border-primary border px-4 py-2 transition-colors"
          >
            <RefreshCw
              className={cn("h-4 w-4 hidden", {
                "animate-spin block": loading,
              })}
            />
            <Plus className={cn("h-4 w-4", { hidden: loading })} />
            Find more
          </Button>
        </div>
      </div>
      {shouldShowLoading ? (
        <Loading />
      ) : shouldShowError ? (
        <Error />
      ) : (
        <div className="mx-auto py-6">
          {notes.length > 0 ? (
            <div className="container mx-auto">
              <MasonryGrid cards={gridCards} />
              {hasMoreInspirationNotes && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-primary hover:text-primary/80"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    More
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-medium mb-4 text-foreground">
                No notes found
              </h3>
              <p className="text-muted-foreground mb-8">
                Be the first to create a note and share your thoughts!
              </p>
              <Link
                href="/notes/new"
                className="px-6 py-3 bg-primary text-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Create Note
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

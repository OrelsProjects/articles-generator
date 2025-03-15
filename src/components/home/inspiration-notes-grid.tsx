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
import { Info, ChevronDown, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="w-full min-h-screen bg-transparent py-8 pb-28 md:py-16 flex justify-center items-start">
      <div className="container">
        <div className="mb-6 mx-auto">
          <div className="flex items-center mb-1">
            <h2 className="text-xl md:text-3xl font-semibold text-foreground">
              Inspirations
            </h2>
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 mt-1"
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
          <p className="text-sm text-muted-foreground">
            Use these high-performing posts as inspirations for your next
            content! Our AI engine selected these for you.
          </p>
        </div>
        {shouldShowLoading ? (
          <Loading />
        ) : shouldShowError ? (
          <Error />
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
                {!loadingMore && hasMoreInspirationNotes ? (
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
                ) : (
                  <div className="flex justify-center mt-8">
                    <span className="text-muted-foreground">
                      You&apos;ve reached the end of the inspiration notes.
                    </span>
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
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

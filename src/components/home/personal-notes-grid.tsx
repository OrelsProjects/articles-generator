"use client";

import React, { useEffect, useState } from "react";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { useNotes } from "@/lib/hooks/useNotes";
import { NoteDraft } from "@/types/note";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import NoteComponent from "@/components/ui/note-component";
import { Button } from "@/components/ui/button";
import { useUi } from "@/lib/hooks/useUi";
import { ChevronDown, Loader2 } from "lucide-react";

export default function PersonalNotesGrid() {
  const { updateShowGenerateNotesSidebar, showGenerateNotesSidebar } = useUi();
  const {
    loadingNotes: loading,
    error,
    fetchNotes,
    userNotes,
    hasMoreUserNotes,
    loadMoreUserNotes,
  } = useNotes();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const shouldShowError = error && !userNotes.length;
  const shouldShowLoading = loading && !userNotes.length;

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMoreUserNotes();
    } catch (err) {
      toast.error("Failed to load more notes");
    } finally {
      setLoadingMore(false);
    }
  };

  const Loading = () => (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3 rounded-xl border p-4 shadow-sm">
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
    </div>
  );

  const Error = () => (
    <div className="w-full h-full mx-auto py-12 text-center bg-background">
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
  const gridCards = userNotes.map((note: NoteDraft) => {
    return {
      id: parseInt(note.id),
      className: "col-span-1",
      content: <NoteComponent note={note} />,
    };
  });

  return (
    <div className="w-full pb-24 bg-transparent py-8">
      <div className="mb-6 container mx-auto">
        <div className="flex items-center mb-1">
          <h1 className="text-xl font-semibold text-foreground">Your notes</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Use these notes as inspirations for your next content!
        </p>
      </div>
      {shouldShowLoading ? (
        <Loading />
      ) : shouldShowError ? (
        <Error />
      ) : (
        <div className="mx-auto py-6">
          {userNotes.length > 0 ? (
            <div className="container mx-auto">
              <MasonryGrid cards={gridCards} />
              {loadingMore && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3 rounded-xl border p-4 shadow-sm">
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
              {hasMoreUserNotes && !loadingMore && (
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
              <Button
                variant={"neumorphic-primary"}
                onClick={() =>
                  updateShowGenerateNotesSidebar(!showGenerateNotesSidebar)
                }
              >
                Create Note
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

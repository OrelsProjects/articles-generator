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
    <div className="w-full h-full mx-auto py-12 bg-background">
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
              {hasMoreUserNotes && (
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

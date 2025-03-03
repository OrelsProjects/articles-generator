"use client";

import React, { useState } from "react";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { useNotes } from "@/lib/hooks/useNotes";
import { convertJsonToHtml, NoteCommentWithAttachment } from "@/types/note";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { RefreshCw, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { NotesComments } from "../../../prisma/generated/articles";
import { ImageModal } from "@/components/ui/image-modal";
import { cn } from "@/lib/utils";

export default function HomeContent() {
  const { loading, error, fetchNotes, notes } = useNotes();
  // Track expanded cards
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading && !notes.length) {
    return (
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
  }

  if (error) {
    return (
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
  }

  // Transform notes into the format expected by MasonryGrid
  const gridCards = notes.map(
    (note: NoteCommentWithAttachment, index: number) => {
      const isExpanded = expandedCards[note.id] || false;

      // Convert HTML content to a format we can manipulate
      const htmlContent = convertJsonToHtml(note.bodyJson);

      return {
        id: parseInt(note.id),
        className: "col-span-1 bg-background rounded-lg p-4",
        content: (
          <div className="flex flex-col">
            <div className="flex items-start">
              <div 
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden cursor-pointer"
                onClick={() => note.photoUrl && setSelectedImage({ url: note.photoUrl, alt: note.handle || "Author" })}
              >
                {note.photoUrl ? (
                  <Image
                    src={note.photoUrl}
                    alt={note.handle || "Author"}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <span>{note.handle?.charAt(0) || "A"}</span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <div className="flex items-center flex-wrap">
                    <p className="font-semibold text-foreground">
                      {note.handle}
                    </p>
                    <p className="text-xs text-muted-foreground ml-1">
                      @{note.handle?.toLowerCase().replace(/\s/g, "")}
                    </p>
                    <span className="mx-1 text-muted-foreground">·</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-1 relative">
                  <div
                    className={cn(
                      "text-base text-foreground overflow-hidden transition-all duration-200",
                      isExpanded ? "max-h-none" : "max-h-[200px]"
                    )}
                  >
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: htmlContent,
                      }}
                    />
                    {!isExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
                    )}
                  </div>
                  {note.attachment && (
                    <div 
                      className="mt-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200"
                      onClick={() => setSelectedImage({ url: note.attachment!, alt: "Note attachment" })}
                    >
                      <Image
                        src={note.attachment}
                        alt="Attachment"
                        width={400}
                        height={300}
                        className="w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => toggleCardExpansion(note.id)}
                    className="text-xs text-primary hover:underline focus:outline-none mt-1 block ml-auto"
                  >
                    {isExpanded ? "less" : "more"}
                  </button>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="flex space-x-3">
                    <span className="text-xs text-muted-foreground flex items-center text-red-500">
                      <Heart className="h-4 w-4 mr-1 text-red-500 fill-red-500" />
                      {note.reactionCount}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {note.commentsCount}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <p>{note.restacks}</p>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="text-primary/80 text-sm shadow-none"
                  >
                    <p className="text-xs">Edit & post</p>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ),
      };
    },
  );

  return (
    <>
      <div className="w-full min-h-screen bg-transparent">
        <div className="mx-auto py-6">
          {notes.length > 0 ? (
            <div className="w-full">
              <MasonryGrid cards={gridCards} columns={3} gap={3} />
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
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
        />
      )}
    </>
  );
}

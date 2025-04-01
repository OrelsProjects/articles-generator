"use client";

import React, { useState } from "react";
import {
  Bell,
  Mail,
  Bookmark,
  Twitter,
  FileText,
  MessageCircle,
  ChevronDown,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useWriter } from "@/lib/hooks/useWriter";
import NoteComponent from "@/components/ui/note-component";
import ArticleComponent from "@/components/ui/article-component";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUi } from "@/lib/hooks/useUi";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

const LoadingNotes = ({
  notesAndArticlesOnly,
}: {
  notesAndArticlesOnly?: boolean;
}) => (
  <div className="min-h-screen bg-background">
    <div
      className={cn("bg-card shadow", {
        hidden: notesAndArticlesOnly,
      })}
    >
      <div
        className={cn("max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8", {
          "!py-0": notesAndArticlesOnly,
        })}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <Skeleton className="w-24 h-24 rounded-full" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function WriterPage({
  params,
}: {
  params: { handle: string; name?: string };
}) {
  const {
    writer,
    isLoading,
    fetchNextPage,
    hasMore,
    error,
    isLoadingMore,
    fetchAuthorNotes,
  } = useWriter(params.handle);
  const [activeTab, setActiveTab] = useState("notes");
  const [loadingAuthorNotes, setLoadingAuthorNotes] = useState(false);
  const { hasPopulateNotes } = useUi();
  if (isLoading || (!writer && !error)) {
    return <LoadingNotes />;
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Error loading writer {error.message}
      </div>
    );
  }

  if (!writer) {
    return <div className="text-center text-destructive">Writer not found</div>;
  }

  const noteCards = writer.topNotes.map(note => ({
    id: note.id,
    content: <NoteComponent note={note} />,
    // thumbnail: note.thumbnail,
  }));

  const handleFetchAuthorNotes = async () => {
    setLoadingAuthorNotes(true);
    try {
      await fetchAuthorNotes({ authorId: writer.authorId });

      toast.success("Data is being fetched. This can take up to 5 minutes.");
    } catch (error: any) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
      } else {
        toast.error("Failed to fetch author data");
      }
    } finally {
      setLoadingAuthorNotes(false);
    }
  };

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
              <h1 className="text-lg md:text-xl font-bold text-foreground">
                {writer.name}
              </h1>
              <p className="text-muted-foreground">@{writer.handle}</p>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                {writer.bio}
              </p>
            </div>
          </div>
          {hasPopulateNotes && (
            <Button
              variant="neumorphic-primary"
              size="sm"
              onClick={handleFetchAuthorNotes}
              disabled={loadingAuthorNotes}
              className="flex gap-2 items-center"
            >
              {loadingAuthorNotes ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Populate Notes
            </Button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="h-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs
          defaultValue="notes"
          className="w-fit"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-6">
            <MasonryGrid cards={noteCards} columns={3} gap={4} />
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {writer.topArticles.map(article => (
                <ArticleComponent key={article.id} article={article} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {isLoadingMore && <LoadingNotes notesAndArticlesOnly />}
        {hasMore && (
          <div className="w-full flex justify-center mt-8">
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

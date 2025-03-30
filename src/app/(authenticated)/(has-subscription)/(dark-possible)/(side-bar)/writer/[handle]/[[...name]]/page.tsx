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
} from "lucide-react";
import { useWriter } from "@/lib/hooks/useWriter";
import NoteComponent from "@/components/ui/note-component";
import ArticleComponent from "@/components/ui/article-component";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0">
        <div className="lg:w-1/2 space-y-6">
          <div
            className={cn("flex items-center space-x-2", {
              hidden: notesAndArticlesOnly,
            })}
          >
            <MessageCircle className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Top Notes</h2>
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="lg:w-1/2 space-y-6">
          <div
            className={cn("flex items-center space-x-2", {
              hidden: notesAndArticlesOnly,
            })}
          >
            <FileText className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Top Articles</h2>
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
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
  const { writer, isLoading, fetchNextPage, hasMore, error, isLoadingMore } =
    useWriter(params.handle);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [isArticlesExpanded, setIsArticlesExpanded] = useState(true);

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

  //   const quickActions = [];

  return (
    <div className="h-screen bg-background">
      {/* Header/Profile Section */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
        </div>
      </div>

      {/* Content Section */}
      <div className="h-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0">
          {/* Top Notes */}
          <div className="lg:w-1/2 space-y-6">
            <Button
              variant="link"
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="flex items-center space-x-2 w-fit group px-0"
            >
              <MessageCircle className="text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">Top Notes</h2>
              <ChevronDown 
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-150",
                  isNotesExpanded ? "transform rotate-180" : ""
                )} 
              />
            </Button>
            <div className={cn(
              "space-y-4 transition-all duration-200 overflow-hidden",
              isNotesExpanded ? "max-h-[2000px]" : "max-h-0"
            )}>
              {writer.topNotes.map(note => (
                <NoteComponent key={note.id} note={note} />
              ))}
            </div>
          </div>

          {/* Top Articles */}
          <div className="lg:w-1/2 space-y-6">
            <Button 
              variant="link"
              onClick={() => setIsArticlesExpanded(!isArticlesExpanded)}
              className="flex items-center space-x-2 w-fit group px-0"
            >
              <FileText className="text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">Top Articles</h2>
              <ChevronDown 
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-150",
                  isArticlesExpanded ? "transform rotate-180" : ""
                )} 
              />
            </Button>
            <div className={cn(
              "space-y-4 transition-all duration-200 overflow-hidden",
              isArticlesExpanded ? "max-h-[2000px]" : "max-h-0"
            )}>
              {writer.topArticles.map(article => (
                <ArticleComponent key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>
        {isLoadingMore && <LoadingNotes notesAndArticlesOnly />}
        {hasMore && (
          <div className="w-full flex justify-center mx-auto px-4 py-8 sm:px-6 lg:px-8">
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

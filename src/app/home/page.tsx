"use client";

import React, { useState } from "react";
import NotesGrid from "@/components/home/notes-grid";
import Sidebar from "@/components/home/sidebar";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, Info, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useNotes } from "@/lib/hooks/useNotes";
import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";

export default function HomePage() {
  const { loading, fetchNotes } = useNotes();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/80">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="max-w-7xl mx-auto px-4 py-6 z-10">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <h1 className="text-xl font-semibold text-foreground">
                Post inspirations
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Post inspirations information</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Use these high-performing posts as inspirations for your next
              content! Our AI engine selected these for you.
            </p>
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="ghost"
                className="text-sm flex items-center gap-2 px-2 font-black text-foreground underline underline-offset-2"
              >
                <Edit className="h-4 w-4" />
                Edit my personalized feed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotes}
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

          {/* Content */}
          <NotesGrid />
        </div>

        <GenerateNotesSidebar />
      </div>
    </div>
  );
}

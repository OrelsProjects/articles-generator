"use client";

import { IdeasPanel } from "@/components/ui/text-editor/ideas-panel";
import TextEditor from "@/components/ui/text-editor/text-editor";
import { useAppSelector } from "@/lib/hooks/redux";
import { Idea } from "@/types/idea";
import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/app/(content)/editor/header";
import { selectUi } from "@/lib/features/ui/uiSlice";
import { IdeasSideSheet } from "@/components/ui/text-editor/ideas-panel-side-sheet";
import { AnalyzePublicationDialog } from "@/components/ui/text-editor/analyze-publication-dialog";
import GenerateIdeasDialog from "@/components/ui/generate-ideas-dialog";

const MobilesIdeasPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectIdea = (_: Idea) => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          variant="default"
          className={cn(
            "md:hidden fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg p-0",
            "flex items-center justify-center",
            isOpen && "hidden",
          )}
        >
          <Lightbulb className="h-6 w-6 text-primary-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetTitle className="sr-only">Ideas</SheetTitle>
        <IdeasPanel onSelectIdea={handleSelectIdea} onClose={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

export default function IdeasPage() {
  const { state } = useAppSelector(selectUi);
  const { publications, selectedIdea } = useAppSelector(
    state => state.publications,
  );
  const isWritingMode = state === "writing-mode";

  return (
    <div className="w-screen h-screen flex flex-col items-center overflow-clip">
      <GenerateIdeasDialog />
      <AnalyzePublicationDialog />
      <Header />
      <div className="h-full w-full flex flex-row md:grid md:grid-cols-8 2xl:grid-cols-7 relative">
        {/* Main editor area - expands when in writing mode */}
        <div
          className={cn(
            "h-full w-full transition-all duration-300 ease-in-out",
            isWritingMode
              ? "md:col-span-8 2xl:col-span-7"
              : "md:col-span-6 2xl:col-span-5",
          )}
        >
          <TextEditor publication={publications[0]} />
        </div>

        {/* Desktop Ideas Panel - collapses when in writing mode */}
        <div
          className={cn(
            "w-full h-screen hidden md:block transition-all duration-300 ease-in-out",
          )}
        >
          <IdeasSideSheet
            publication={publications[0] || null}
            selectedIdea={selectedIdea || null}
          />
        </div>

        {/* Mobile Ideas Panel */}
        <MobilesIdeasPanel />
      </div>
    </div>
  );
}

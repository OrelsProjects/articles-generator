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
import { Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/app/(content)/editor/header";

const MobilesIdeasPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectIdea = (idea: Idea) => {
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
        <IdeasPanel onSelectIdea={handleSelectIdea} />
      </SheetContent>
    </Sheet>
  );
};

export default function Ideas() {
  console.log("Ideas");
  const { publications } = useAppSelector(state => state.publications);

  return (
    <div className="w-screen h-screen flex flex-col items-center overflow-clip">
      <Header />
      <div className="h-full w-full flex flex-row md:grid md:grid-cols-8 2xl:grid-cols-7 relative">
        {/* Main editor area - 4/7 on desktop, full width on mobile */}
        <div className="h-full w-full md:col-span-6 2xl:col-span-5">
          <TextEditor publication={publications[0]} />
        </div>

        {/* Desktop Ideas Panel - 3/7 width */}
        <div className="h-[calc(100vh-5rem)] hidden md:block md:col-span-2 2xl:col-span-2">
          <IdeasPanel />
        </div>
        <MobilesIdeasPanel />
      </div>
    </div>
  );
}

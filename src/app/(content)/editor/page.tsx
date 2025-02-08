"use client";

import { IdeasPanel } from "@/components/ui/text-editor/ideas-panel";
import TextEditor from "@/components/ui/text-editor/text-editor";
import { useAppSelector } from "@/lib/hooks/redux";
import { Idea } from "@/models/idea";
import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Ideas() {
  const { publications, ideas } = useAppSelector(state => state.publications);
  const [ideaSelected, setIdeaSelected] = useState<Idea | null>(
    ideas[0] || null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectIdea = (idea: Idea) => {
    setIdeaSelected(idea);
    setIsOpen(false); // Close panel on mobile after selection
  };

  return (
    <div className="w-full h-screen flex flex-row overflow-clip relative">
      <TextEditor publication={publications[0]} ideaSelected={ideaSelected} />

      {/* Desktop Ideas Panel */}
      <div className="hidden md:block">
        <IdeasPanel ideas={ideas} onSelectIdea={handleSelectIdea} />
      </div>

      {/* Mobile Sheet/Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "md:hidden fixed bottom-6 right-6 rounded-full h-12 w-12 !p-2",
              isOpen && "hidden",
            )}
          >
            <Lightbulb className="h-6 w-6 text-primary-foreground" />
          </Button> 
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] px-0 pb-16">
          <IdeasPanel
            ideas={ideas}
            onSelectIdea={handleSelectIdea}
            onClose={() => setIsOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

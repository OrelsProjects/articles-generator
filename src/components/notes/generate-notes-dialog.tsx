"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Pencil, Sparkles } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { cn } from "@/lib/utils";
import { useNotes } from "@/lib/hooks/useNotes";
import {
  AiModelsDropdown,
  FrontendModel,
} from "@/components/notes/ai-models-dropdown";
import { ToastStepper } from "@/components/ui/toast-stepper";
import { toast } from "react-toastify";

const ideaLoadingStates = [
  { text: "Finding relevant notes..." },
  { text: "Gathering inspiration from top notes..." },
  { text: "Putting together unique ideas..." },
  { text: "Finalizing the best notes..." },
];

export interface GenerateNotesDialogProps {}

export function GenerateNotesDialog() {
  const [topic, setTopic] = useState("");
  const { generateNewNotes, isLoadingGenerateNotes, errorGenerateNotes } =
    useNotes();

  const [selectedModel, setSelectedModel] =
    useState<FrontendModel>("claude-3.7");

  useEffect(() => {
    if (errorGenerateNotes) {
      toast.error(errorGenerateNotes);
    }
  }, [errorGenerateNotes]);

  const handleGenerateNewNote = async () => {
    if (isLoadingGenerateNotes) {
      return;
    }
    try {
      await generateNewNotes(selectedModel, {
        topic,
      });
    } catch (e: any) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateNewNote();
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="neumorphic-primary"
            size="icon"
            className={cn(
              "md:hidden fixed h-12 w-12 bottom-20 right-4 z-50 transition-all duration-300 bg-background shadow-md border border-border hover:bg-background p-0",
            )}
          >
            <Pencil className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <TooltipButton
            tooltipContent="Generate personalized notes"
            variant="neumorphic-primary"
            className="hidden md:flex"
          >
            <Sparkles size={16} className="h-4 w-4 mr-2" />
            Generate notes
          </TooltipButton>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generate new notes</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="topic" className="col-span-4">
                  Topic
                </Label>
                <div className="col-span-4 relative">
                  <Input
                    id="topic"
                    placeholder="The topic of the notes (optional)"
                    className="w-full pr-20"
                    maxLength={200}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />

                  <AiModelsDropdown
                    onModelChange={setSelectedModel}
                    className="absolute right-0 top-0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogTrigger asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button type="submit" disabled={isLoadingGenerateNotes}>
                  {isLoadingGenerateNotes
                    ? "Generating..."
                    : topic
                      ? "Generate based on your topic (3)"
                      : "Generate personalized notes (3)"}
                </Button>
              </DialogTrigger>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ToastStepper
        loadingStates={ideaLoadingStates}
        loading={isLoadingGenerateNotes}
        duration={7500}
        loop={false}
        position="bottom-left"
      />
    </>
  );
}

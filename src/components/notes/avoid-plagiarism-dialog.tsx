"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

interface AvoidPlagiarismDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AvoidPlagiarismDialog({
  open,
  onOpenChange,
  onConfirm,
}: AvoidPlagiarismDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Make it your own
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px]">
                  <p>
                    Copying someone else&apos;s work without modification can be
                    considered plagiarism.
                    <br /> WriteStack encourages you to use others notes, but
                    make sure to make it your own.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription className="text-left">
            In order to be fair to the original author,
            <br />
            Please change something in the note before saving it.
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use our AI to rewrite the note in your own words</li>
              <li>Add your unique perspective</li>
              <li>Expand with your own insights</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            I&apos;ll Edit It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { PuzzleIcon } from "lucide-react";

interface ExtensionInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ExtensionInstallDialog({
  open,
  onOpenChange,
  onInstall,
  onRefresh,
  loading,
}: ExtensionInstallDialogProps) {
  const handleInstall = () => {
    // Open Chrome extension store in a new tab
    window.open(
      process.env.NEXT_PUBLIC_EXTENSION_URL ||
        "https://chrome.google.com/webstore/category/extensions",
      "_blank",
    );
    onInstall();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            aria-label="Chrome Extension Required"
            className="flex items-center gap-2"
          >
            <PuzzleIcon className="h-5 w-5 text-primary" />
            Chrome Extension Required
          </DialogTitle>
          <DialogDescription>
            To post directly to Substack, you need to install WriteStack&apos;s
            Chrome extension. It only takes a minute and enables scheduling
            notes.
            <br />
            <br />
            <span className="text-foreground">
              <span
                onClick={() => {
                  window.location.reload();
                }}
                className="text-primary cursor-pointer underline"
              >
                (Refresh after installation)
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Next time
          </Button>
          <Button
            variant="neumorphic-primary"
            onClick={handleInstall}
            disabled={loading}
          >
            Let&apos;s go!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

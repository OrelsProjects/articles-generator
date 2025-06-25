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
import { PuzzleIcon, RefreshCw } from "lucide-react";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "WriteStack";

interface ExtensionInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: () => void;
  onRefresh: () => void;
  loading: boolean;
  selectedNoteId?: string;
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
            The action you are trying to perform requires {appName}&apos;s
            Chrome extension. It only takes a minute and enables scheduling
            notes.
            <br />
            <br />
            <span className="text-foreground">
              <span
                onClick={loading ? undefined : onRefresh}
                className={cn(
                  "text-primary cursor-pointer underline flex items-center gap-2",
                  {
                    "opacity-50 cursor-not-allowed": loading,
                  },
                )}
              >
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
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
            Install the extension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

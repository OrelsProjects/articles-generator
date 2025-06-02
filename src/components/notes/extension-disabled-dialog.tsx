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
import { CopyIcon, PuzzleIcon } from "lucide-react";
import { toast } from "react-toastify";

interface ExtensionDisabledDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function ExtensionDisabledDialog({
  open,
  onOpenChange,
  onRefresh,
}: ExtensionDisabledDialogProps) {
  const handleOpenExtensionSettings = () => {
    debugger;
    const url = process.env.NEXT_PUBLIC_EXTENSION_CHROME_URL;
    if (url) {
      window.open(url, "_blank");
    }
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(
      process.env.NEXT_PUBLIC_EXTENSION_CHROME_URL || "",
    );
    toast.success("URL copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PuzzleIcon className="h-5 w-5 text-primary" />
            Enable Chrome Extension
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              To continue with your action, you need to enable the WriteStack
              Chrome extension.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Copy the following URL:{" "}
                <span
                  className="text-primary cursor-pointer"
                  onClick={copyUrlToClipboard}
                >
                  {process.env.NEXT_PUBLIC_EXTENSION_CHROME_URL}
                </span>
              </li>
              <li>Paste it in your browser address bar</li>
              <li>Press Enter</li>
              <li>Make sure the toggle switch is enabled (turned on)</li>
              <li>Refresh this page</li>
            </ol>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button variant="ghost" onClick={onRefresh}>
            Refresh
          </Button>
          <Button variant="default" onClick={onRefresh}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

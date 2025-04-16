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
import { Check, ExternalLink } from "lucide-react";
import { CreatePostResponse } from "@/types/createPostResponse";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: CreatePostResponse | null;
}

export function SuccessDialog({
  open,
  onOpenChange,
  response,
}: SuccessDialogProps) {
  const handleViewNote = () => {
    if (response) {
      window.open(
        `https://substack.com/@${response.user_primary_publication.subdomain}/note/c-${response.id}`,
        "_blank",
      );
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            aria-label="Note posted successfully"
            className="flex items-center gap-2"
          >
            <Check className="h-5 w-5 text-green-500" />
            Note posted successfully!
          </DialogTitle>
          <DialogDescription>
            Your note has been published to Substack.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button onClick={handleViewNote}>
            View note <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setNotePostedData, selectUi } from "@/lib/features/ui/uiSlice";
import Link from "next/link";

export function NotePostedSuccessDialog() {
  const dispatch = useAppDispatch();
  const { notePostedData } = useAppSelector(selectUi);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dispatch(setNotePostedData(null));
    }
  };

  return (
    <Dialog open={!!notePostedData} onOpenChange={handleOpenChange}>
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
          <Button asChild>
            <Link
              href={`https://substack.com/@${notePostedData?.user_primary_publication?.subdomain}/note/c-${notePostedData?.id}`}
              target="_blank"
            >
              View note <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

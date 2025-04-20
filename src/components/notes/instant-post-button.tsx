import { useEffect, useRef, useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useExtension } from "@/lib/hooks/useExtension";
import { SuccessDialog } from "@/components/notes/success-dialog";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { Note, NoteDraft } from "@/types/note";
import { useNotes } from "@/lib/hooks/useNotes";
import { cn } from "@/lib/utils";
import { EventTracker } from "@/eventTracker";
import { CreatePostResponse } from "@/types/createPostResponse";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

interface SubstackPostButtonProps {
  onSave?: () => Promise<string | null>;
  onLoadingChange?: (loading: boolean) => void;
  noteId: string | null;
  size?: "sm" | "lg" | "default" | "icon";
  variant?: "ghost" | "default" | "outline";
  disabled?: boolean;
  source: string;
  className?: string;
  children?: React.ReactNode;
}

export function InstantPostButton({
  noteId,
  onSave,
  onLoadingChange,
  size = "sm",
  variant = "ghost",
  source,
  className,
  disabled,
  children,
}: SubstackPostButtonProps) {
  const { updateNoteStatus, sendNote, loadingSendNote } = useNotes();

  const [postResponse, setPostResponse] = useState<CreatePostResponse | null>(
    null,
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSendNote = async () => {
    
    EventTracker.track("note_post_button_clicked_" + source);
    let sendNoteId = noteId;
    try {
      onLoadingChange?.(true);
      const customNoteId = await onSave?.();
      if (customNoteId) {
        sendNoteId = customNoteId;
      }
      const response = await sendNote(sendNoteId!);

      if (response) {
        toast.success("Note posted successfully");
        setPostResponse(response);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Error sending post:", error);
      toast.error("Error sending post");
    } finally {
      onLoadingChange?.(false);
    }
  };

  const handleOpenChangeSuccessDialog = (open: boolean) => {
    if (!noteId) return;
    setShowSuccessDialog(open);
    if (!open) {
      updateNoteStatus(noteId, "published");
    }
  };

  return (
    <div className="flex">
      <div className="relative">
        <div className="flex items-center gap-0.5 rounded-lg">
          {children ? (
            children
          ) : (
            <TooltipButton
              tooltipContent="Post note now"
              variant={variant}
              size={size}
              disabled={loadingSendNote || disabled}
              onClick={handleSendNote}
              className={cn("flex items-center gap-2", className)}
            >
              <AnimatePresence>
                <motion.span className="overflow-hidden whitespace-nowrap">
                  Post now
                </motion.span>
              </AnimatePresence>
              {loadingSendNote ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </TooltipButton>
          )}
        </div>
      </div>

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={handleOpenChangeSuccessDialog}
        response={postResponse}
      />
    </div>
  );
}

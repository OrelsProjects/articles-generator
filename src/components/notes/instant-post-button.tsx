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
  onPreSend?: () => unknown;
  onLoadingChange?: (loading: boolean) => void;
  note: Note | NoteDraft | string | null;
  size?: "sm" | "lg" | "default" | "icon";
  variant?: "ghost" | "default" | "outline";
  disabled?: boolean;
  source: string;
  className?: string;
  children?: React.ReactNode;
}

export function InstantPostButton({
  note,
  onPreSend,
  onLoadingChange,
  size = "sm",
  variant = "ghost",
  source,
  className,
  disabled,
  children,
}: SubstackPostButtonProps) {
  const { getNoteById, hasExtension } = useExtension();
  const { updateNoteStatus, sendNote, loadingSendNote } = useNotes();

  const [postResponse, setPostResponse] = useState<CreatePostResponse | null>(
    null,
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSendNote = async () => {
    EventTracker.track("note_post_button_clicked_" + source);
    if (!note) return;
    const noteObject = typeof note === "string" ? getNoteById(note) : note;
    if (!noteObject) return;
    try {
      onLoadingChange?.(true);
      await onPreSend?.();
      const response = await sendNote(noteObject.id);
      if (response) {
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
    if (!note) return;
    setShowSuccessDialog(open);
    if (!open) {
      if (typeof note === "string") updateNoteStatus(note, "published");
      else updateNoteStatus(note.id, "published");
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
              disabled={loadingSendNote || !note || disabled}
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
        onArchiveNote={() => {
          if (!note) return;
          if (typeof note === "string") updateNoteStatus(note, "archived");
          else updateNoteStatus(note.id, "archived");
        }}
      />
    </div>
  );
}

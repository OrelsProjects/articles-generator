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

interface SubstackPostButtonProps {
  note: Note | NoteDraft | string | null;
  size?: "sm" | "lg" | "default" | "icon";
  variant?: "ghost" | "default" | "outline";
  source: string;
  includeText?: boolean;
  tooltipContent?: string;
  className?: string;
}

export function InstantPostButton({
  note,
  size = "sm",
  variant = "ghost",
  tooltipContent = "Post to Substack instantly",
  includeText,
  source,
  className,
}: SubstackPostButtonProps) {
  const { getNoteById, hasExtension } = useExtension();
  const { updateNoteStatus, sendNote, loadingSendNote } = useNotes();

  const [postResponse, setPostResponse] = useState<CreatePostResponse | null>(
    null,
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSendNote = async () => {
    EventTracker.track("note_post_button_clicked_" + source);
    const userHasExtension = await hasExtension();
    if (!userHasExtension) {
      setShowExtensionDialog(true);
      return;
    }
    if (!note) return;
    const noteObject = typeof note === "string" ? getNoteById(note) : note;
    if (!noteObject) return;
    try {
      const response = await sendNote(noteObject.id);
      if (response) {
        setPostResponse(response);
        setShowSuccessDialog(true);
      } else {
        setShowExtensionDialog(true);
      }
    } catch (error) {
      console.error("Error sending post:", error);
      setShowExtensionDialog(true);
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
    <div className="hidden md:flex">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-0.5 rounded-lg">
          <TooltipButton
            // tooltipContent={tooltipContent}
            variant={variant}
            size={size}
            disabled={loadingSendNote || !note}
            onClick={handleSendNote}
            className={cn("flex items-center gap-2", {
              "text-muted-foreground": !isHovered,
            }, className)}
          >
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Post note
                </motion.span>
              )}
            </AnimatePresence>
            {loadingSendNote ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </TooltipButton>
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

      <ExtensionInstallDialog
        open={showExtensionDialog}
        onOpenChange={setShowExtensionDialog}
        onInstall={() => {
          setShowExtensionDialog(false);
        }}
      />
    </div>
  );
}

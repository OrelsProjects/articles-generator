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
  const {
    sendNote,
    isLoading: loadingSendNote,
    postResponse,
    getNoteById,
    hasExtension,
  } = useExtension();
  const { updateNoteStatus } = useNotes();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);

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
      await sendNote({
        message: noteObject.body,
      });

      setShowSuccessDialog(true);
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
    <>
      <TooltipButton
        tooltipContent={tooltipContent}
        variant={variant}
        size={size}
        disabled={loadingSendNote || !note}
        onClick={handleSendNote}
        className={cn(
          {
            "flex gap-2": includeText,
          },
          className,
        )}
      >
        {loadingSendNote ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {includeText && "Post note"}
      </TooltipButton>

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
    </>
  );
}

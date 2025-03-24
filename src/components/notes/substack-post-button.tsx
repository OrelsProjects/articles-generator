import { useEffect, useRef, useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useSubstackPost } from "@/lib/hooks/useSubstackPost";
import { SuccessDialog } from "@/components/notes/success-dialog";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { Note, NoteDraft } from "@/types/note";
import { useNotes } from "@/lib/hooks/useNotes";
import { cn } from "@/lib/utils";
import { EventTracker } from "@/eventTracker";

interface SubstackPostButtonProps {
  note: Note | NoteDraft | null;
  size?: "sm" | "lg" | "default" | "icon";
  variant?: "ghost" | "default" | "outline";
  source: string;
  includeText?: boolean;
  tooltipContent?: string;
  className?: string;
}

export function SubstackPostButton({
  note,
  size = "sm",
  variant = "ghost",
  tooltipContent = "Post instantly",
  includeText,
  source,
  className,
}: SubstackPostButtonProps) {
  const {
    createPost,
    isLoading: loadingSendNote,
    postResponse,
    canUseSubstackPost,
  } = useSubstackPost();
  const { updateNoteStatus } = useNotes();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);

  const handleSendNote = async () => {
    EventTracker.track("note_post_button_clicked_" + source);
    if (!note) return;
    try {
      await createPost({
        message: note.body,
      });

      //   await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Post sent successfully");
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
      updateNoteStatus(note.id, "published");
    }
  };

  // if (!canUseSubstackPost) {
  //   return null;
  // }

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
          updateNoteStatus(note.id, "archived");
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

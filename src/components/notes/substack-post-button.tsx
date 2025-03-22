import { useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useSubstackPost } from "@/lib/hooks/useSubstackPost";
import { SuccessDialog } from "@/components/notes/success-dialog";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { Note, NoteDraft } from "@/types/note";
import { useNotes } from "@/lib/hooks/useNotes";

interface SubstackPostButtonProps {
  note: Note | NoteDraft;
  size?: "sm" | "lg" | "default" | "icon";
  variant?: "ghost" | "default" | "outline";
  tooltipContent?: string;
  className?: string;
}

export function SubstackPostButton({
  note,
  size = "sm",
  variant = "ghost",
  tooltipContent = "Post instantly",
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
    try {
      const response = await createPost({
        message: note.body,
        moveNoteToPublished: {
          noteId: note.id,
        },
      });
      if (response) {
        setShowSuccessDialog(true);
      }
    } catch (error) {
      setShowExtensionDialog(true);
    }
  };

  if (!canUseSubstackPost) {
    return null;
  }

  return (
    <>
      <TooltipButton
        tooltipContent={tooltipContent}
        variant={variant}
        size={size}
        disabled={loadingSendNote}
        onClick={handleSendNote}
        className={className}
      >
        {loadingSendNote ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </TooltipButton>

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        response={postResponse}
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

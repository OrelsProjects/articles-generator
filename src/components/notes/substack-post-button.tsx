import { useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useSubstackPost } from "@/lib/hooks/useSubstackPost";
import { SuccessDialog } from "@/components/notes/success-dialog";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";

interface SubstackPostButtonProps {
  noteBody: string;
  size?: "sm" | "lg" | "default" | "icon";
  variant?: "ghost" | "default" | "outline";
  tooltipContent?: string;
  className?: string;
}

export function SubstackPostButton({
  noteBody,
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);

  const handleSendNote = async () => {
    try {
      const response = await createPost({ message: noteBody });
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

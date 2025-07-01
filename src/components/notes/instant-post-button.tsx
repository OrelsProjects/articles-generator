import { useEffect, useRef, useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useExtension } from "@/lib/hooks/useExtension";
import { Note, NoteDraft } from "@/types/note";
import { useNotes } from "@/lib/hooks/useNotes";
import { cn } from "@/lib/utils";
import { EventTracker } from "@/eventTracker";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/lib/hooks/redux";
import { setNotePostedData } from "@/lib/features/ui/uiSlice";
import { Logger } from "@/logger";

interface SubstackPostButtonProps {
  onSave?: () => Promise<string | null> | string | null;
  onNoteSent?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  noteId: string | null;
  size?: "sm" | "lg" | "default" | "icon";
  variant?: "ghost" | "default" | "outline";
  disabled?: boolean;
  source: string;
  showText?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function InstantPostButton({
  noteId,
  onSave,
  onLoadingChange,
  onNoteSent,
  size = "sm",
  variant = "ghost",
  source,
  showText = true,
  className,
  disabled,
  children,
}: SubstackPostButtonProps) {
  const { updateNoteStatus, sendNote, loadingSendNote } = useNotes();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (loadingSendNote) {
      setLoading(true);

      setLoading(false);
    }
  }, [loadingSendNote]);

  const updateLoading = (loading: boolean) => {
    setLoading(loading);
    onLoadingChange?.(loading);
  };

  const handleSendNote = async () => {
    EventTracker.track("note_post_button_clicked_" + source);
    let sendNoteId = noteId;
    try {
      // updateLoading(true);
      // const customNoteId = await onSave?.();

      // if (customNoteId) {
      //   sendNoteId = customNoteId;
      // }
      const response = await sendNote(sendNoteId!);
      onNoteSent?.();
      if (response) {
        toast.success("Note posted successfully");
        dispatch(setNotePostedData(response));
        if (sendNoteId) {
          updateNoteStatus(sendNoteId, "published");
        }
      }
      updateLoading(false);
    } catch (error) {
      Logger.error("Error sending post:", { error, sendNoteId, noteId });
      toast.error("Error sending post");
      updateLoading(false);
    }
  };

  return (
    <div className="hidden lg:flex">
      <div className="relative">
        <div className="flex items-center gap-0.5 rounded-lg">
          {children ? (
            children
          ) : (
            <TooltipButton
              tooltipContent="Post note now"
              variant={variant}
              size={size}
              disabled={loading || disabled}
              onClick={handleSendNote}
              className={cn("flex items-center gap-2", className)}
            >
              <AnimatePresence>
                {showText && (
                  <motion.span className="overflow-hidden whitespace-nowrap">
                    Post now
                  </motion.span>
                )}
              </AnimatePresence>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </TooltipButton>
          )}
        </div>
      </div>
    </div>
  );
}

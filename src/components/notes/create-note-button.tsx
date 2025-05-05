import { Loader, Loader2 } from "lucide-react";

import { TooltipButton } from "@/components/ui/tooltip-button";
import { Plus } from "lucide-react";
import { useNotes } from "@/lib/hooks/useNotes";

export function CreateNoteButton() {
  const { createDraftNote, loadingCreateNote } = useNotes();

  return (
    <TooltipButton
      tooltipContent="Start writing"
      variant="ghost"
      onClick={() => createDraftNote()}
      className="items-center gap-2"
      disabled={loadingCreateNote}
    >
      {loadingCreateNote ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus size={16} />
      )}
      New draft
    </TooltipButton>
  );
}

import { Loader2, Plus, ChevronDown, StickyNote } from "lucide-react";

import { TooltipButton } from "@/components/ui/tooltip-button";
import { useNotes } from "@/lib/hooks/useNotes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GenerateNotesDialog } from "./generate-notes-dialog";

export function CreateNoteButton() {
  const { createDraftNote, loadingCreateNote } = useNotes();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TooltipButton
          tooltipContent="Create content"
          variant="outline"
          className="items-center gap-2"
        >
          <Plus size={16} />
          New note
          <ChevronDown className="h-4 w-4" />
        </TooltipButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => createDraftNote()}
          disabled={loadingCreateNote}
          className="cursor-pointer"
        >
          {loadingCreateNote ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <StickyNote className="h-4 w-4 mr-2" />
          )}
          New draft
        </DropdownMenuItem>
        <GenerateNotesDialog variant="ghost" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

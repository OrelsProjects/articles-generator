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
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CreateNoteButton() {
  const { createDraftNote, loadingCreateNote } = useNotes();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus size={16} />
          New note
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Button
          variant="ghost"
          onClick={() => createDraftNote().finally(() => setOpen(false))}
          disabled={loadingCreateNote}
          className="w-full cursor-pointer p-1.5 hover flex justify-start"
        >
          {loadingCreateNote ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <StickyNote className="h-4 w-4 mr-2" />
          )}
          New draft
        </Button>
        <GenerateNotesDialog variant="ghost" tooltip={false} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

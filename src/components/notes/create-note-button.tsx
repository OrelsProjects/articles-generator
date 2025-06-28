import { Loader2, Plus, ChevronDown, StickyNote, Sparkles } from "lucide-react";

import { useNotes } from "@/lib/hooks/useNotes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUi } from "@/lib/hooks/useUi";

export function CreateNoteButton() {
  const { createDraftNote, loadingCreateNote } = useNotes();
  const { updateShowGenerateNotesDialog } = useUi();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: Two buttons side by side */}
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => createDraftNote()}
          disabled={loadingCreateNote}
          className="items-center gap-2"
        >
          {loadingCreateNote ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <StickyNote className="h-4 w-4" />
          )}
          New draft
        </Button>
        <Button
          variant="outline"
          onClick={() => updateShowGenerateNotesDialog(true)}
          className="items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate notes
        </Button>
      </div>

      {/* Mobile: Dropdown menu */}
      <div className="md:hidden">
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
            <Button
              variant="ghost"
              className="flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
              onClick={() => {
                updateShowGenerateNotesDialog(true);
                setOpen(false);
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate notes
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

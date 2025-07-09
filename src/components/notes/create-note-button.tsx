import { Loader2, Plus, ChevronDown, StickyNote, Sparkles } from "lucide-react";

import { useNotes } from "@/lib/hooks/useNotes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useUi } from "@/lib/hooks/useUi";
import { useGhostwriterNotes } from "@/lib/hooks/useGhostwriterNotes";

export function CreateNoteButton({ clientId }: { clientId?: string | null }) {
  const { createDraftNote, loadingCreateNote } = useNotes();
  const { createDraftNote: createGhostwriterNote, loadingCreateNote: loadingCreateGhostwriterNote } = useGhostwriterNotes();
  const { updateShowGenerateNotesDialog } = useUi();
  const [open, setOpen] = useState(false);


  const loadingCreate = useMemo(() => {
    if (clientId) {
      return loadingCreateGhostwriterNote;
    }
    return loadingCreateNote;
  }, [clientId, loadingCreateGhostwriterNote, loadingCreateNote]);

  const createDraft = useMemo(() => {
    if (clientId) {
      return createGhostwriterNote;
    }
    return createDraftNote;
  }, [clientId, createGhostwriterNote, createDraftNote]);

  return ( 
    <>
      {/* Desktop: Two buttons side by side */}
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => createDraft(undefined, { clientId })}
          disabled={loadingCreate}
          className="items-center gap-2"
        >
          {loadingCreate ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <StickyNote className="h-4 w-4" />
          )}
          New draft
        </Button>
        <Button
          variant="outline"
          onClick={() => updateShowGenerateNotesDialog(true,clientId)}
          className="items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Notes generator
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
              onClick={() => createDraftNote(undefined, { clientId }).finally(() => setOpen(false))}
              disabled={loadingCreate}
              className="w-full cursor-pointer p-1.5 hover flex justify-start"
            >
              {loadingCreate ? (
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
                updateShowGenerateNotesDialog(true, clientId  );
                setOpen(false);
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Notes generator
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

"use client";

import { useEffect } from "react";
import { NotesStatusBoard } from "@/components/notes/notes-status-board";
import { useNotes } from "@/lib/hooks/useNotes";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch } from "@/lib/hooks/redux";
import { resetNotification } from "@/lib/features/notes/notesSlice";
import { GenerateNotesDialog } from "@/components/notes/generate-notes-dialog";
import { CreateNoteButton } from "@/components/notes/create-note-button";

const TITLE = "Your notes (Kanban)";

export default function StatusBoardPage() {
  const dispatch = useAppDispatch();
  const { fetchNotes, userNotes, loadingNotes, createDraftNote } = useNotes();

  useEffect(() => {
    dispatch(resetNotification());
    fetchNotes(30);
  }, []);

  if (loadingNotes && userNotes.length === 0) {
    return (
      <div className="w-full py-8 flex justify-center items-start">
        <div className="container px-4 md:px-16 lg:px-24">
          <h1 className="text-3xl font-bold mb-8">{TITLE}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col h-full">
                <Skeleton className="h-8 w-20 mb-4" />
                <Skeleton className="h-[500px] w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 flex justify-center items-start">
      <div className="container px-6 md:px-16 lg:px-24">
        <div className="flex justify-between items-center mb-12">
          <div className="w-full justify-between items-center gap-2">
            <h1 className="text-3xl font-bold">{TITLE}</h1>
          </div>
          <div className="flex flex-col md:flex-row justify-end items-center gap-2">
            <CreateNoteButton />
            <GenerateNotesDialog />
          </div>
        </div>
        <NotesStatusBoard notes={userNotes} />
      </div>
    </div>
  );
}

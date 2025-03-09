"use client";

import { useEffect } from "react";
import { NotesStatusBoard } from "@/components/notes/notes-status-board";
import { useNotes } from "@/lib/hooks/useNotes";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch } from "@/lib/hooks/redux";
import { resetNotification } from "@/lib/features/notes/notesSlice";

export default function StatusBoardPage() {
  const dispatch = useAppDispatch();
  const { fetchNotes, userNotes, loadingNotes } = useNotes();

  useEffect(() => {
    dispatch(resetNotification());
    fetchNotes(30);
  }, []);

  if (loadingNotes && userNotes.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Notes Status Board</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col h-full">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-[500px] w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 flex justify-center items-start">
      <div className="w-full px-4 md:px-16 lg:px-24">
        <h1 className="text-3xl font-bold mb-8">Notes Status Board</h1>
        <NotesStatusBoard notes={userNotes} />
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { NotesStatusBoard } from "@/components/notes/notes-status-board";
import { useNotes } from "@/lib/hooks/useNotes";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatusBoardPage() {
  const { fetchNotes, userNotes, loadingNotes } = useNotes();

  useEffect(() => {
    fetchNotes();
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
    <div className="w-full py-8 px-12">
      <h1 className="text-3xl font-bold mb-8">Notes Status Board</h1>
      <NotesStatusBoard notes={userNotes} />
    </div>
  );
} 
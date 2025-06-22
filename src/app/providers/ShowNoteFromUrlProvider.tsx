"use client";

import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useNotes } from "@/lib/hooks/useNotes";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ShowNoteFromUrlProvider() {
  const searchParams = useSearchParams();
  const router = useCustomRouter();
  const pathname = usePathname();
  const noteId = searchParams.get("noteId");
  const { selectNote, userNotes } = useNotes();

  useEffect(() => {
    if (noteId) {
      const userNote = userNotes.find(note => note.id === noteId);
      if (userNote) {
        selectNote(userNote);
        router.push(pathname, {
          paramsToRemove: ["noteId"],
        });
      }
    }
  }, [noteId, userNotes]);

  return null;
}

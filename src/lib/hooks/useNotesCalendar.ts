import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { selectNotes, updateNote } from "@/lib/features/notes/notesSlice";
import { NoteDraft } from "@/types/note";
import axios from "axios";
import { Logger } from "@/logger";

export const useNotesCalendar = () => {
  const dispatch = useAppDispatch();
  const { userNotes, loadingNotes, error } = useAppSelector(selectNotes);

  const [loadingUpdateNote, setLoadingUpdateNote] = useState(false);

  const updateNoteDate = useCallback(
    async (note: NoteDraft) => {
      setLoadingUpdateNote(true);

      try {
        // Update local state first
        dispatch(
          updateNote({
            id: note.id,
            note: { postDate: note.postDate },
          }),
        );
        // set 0,0,0,0 to the postDate (hrs, mins, secs, ms), keep same day, month, year
        if (note.postDate) {
          note.postDate = new Date(
            note.postDate.getFullYear(),
            note.postDate.getMonth(),
            note.postDate.getDate(),
            0,
            0,
            0,
          );
        }

        // Then update on server
        await axios.patch(`/api/note/${note.id}`, {
          postDate: note.postDate,
        });
      } catch (error: any) {
        Logger.error("Error updating note date:", error);
        throw error;
      } finally {
        setLoadingUpdateNote(false);
      }
    },
    [dispatch],
  );

  return {
    notes: userNotes,
    loading: loadingNotes,
    error,
    updateNoteDate,
    loadingUpdateNote,
  };
};

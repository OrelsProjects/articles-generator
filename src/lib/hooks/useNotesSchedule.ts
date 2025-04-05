import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { selectNotes, updateNote } from "@/lib/features/notes/notesSlice";
import { NoteDraft } from "@/types/note";
import axios from "axios";
import { Logger } from "@/logger";

export const useNotesSchedule = () => {
  const dispatch = useAppDispatch();
  const { userNotes, loadingNotes, error } = useAppSelector(selectNotes);

  const [loadingUpdateNote, setLoadingUpdateNote] = useState(false);

  const scheduleNote = useCallback(
    async (note: NoteDraft) => {
      setLoadingUpdateNote(true);

      const previousNote = userNotes.find(n => n.id === note.id);

      try {
        // Then update on server
        await axios.post(`/api/user/notes/${note.id}/schedule`, {
          date: note.scheduledTo,
        });
        dispatch(
          updateNote({
            id: note.id,
            note: {
              scheduledTo: note.scheduledTo,
              status: "scheduled",
            },
          }),
        );
      } catch (error: any) {
        Logger.error("Error updating note date:", error);
        dispatch(
          updateNote({
            id: note.id,
            note: {
              scheduledTo: previousNote?.scheduledTo,
              status: previousNote?.status,
            },
          }),
        );
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
    scheduleNote,
    loadingUpdateNote,
  };
};

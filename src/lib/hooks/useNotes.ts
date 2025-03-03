import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  selectNotes,
  setNotes,
  setLoading,
  setError,
  setSelectedNote,
  addInspirationNotes,
} from "@/lib/features/notes/notesSlice";
import { Note } from "@/types/note";
import axios from "axios";

export const useNotes = () => {
  const dispatch = useAppDispatch();
  const { notes, selectedNote, loading, error, inspirationNotes } =
    useAppSelector(selectNotes);

  const loadingRef = useRef(false);

  const fetchNotes = async () => {
    if (loadingRef.current) return;
    try {
      loadingRef.current = true;
      dispatch(setLoading(true));
      const response = await axios.post("/api/notes/inspiration", {
        existingNotesIds: inspirationNotes.map(note => note.id),
      });
      dispatch(setError(null));
      dispatch(addInspirationNotes(response.data));
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "An unknown error occurred",
        ),
      );
      console.error("Error fetching notes:", error);
    } finally {
      dispatch(setLoading(false));
      loadingRef.current = false;
    }
  };

  const selectNote = useCallback(
    (note: Note | null) => {
      dispatch(setSelectedNote(note));
    },
    [dispatch],
  );

  useEffect(() => {
    if (inspirationNotes.length === 0) {
      fetchNotes();
    }
  }, [inspirationNotes]);

  return {
    notes: inspirationNotes,
    selectedNote,
    loading,
    error,
    fetchNotes,
    selectNote,
  };
};

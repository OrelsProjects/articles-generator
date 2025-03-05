import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  selectNotes,
  setNotes,
  setLoading,
  setError,
  setSelectedNote,
  addInspirationNotes,
  addNotes,
} from "@/lib/features/notes/notesSlice";
import { Note } from "@/types/note";
import axios from "axios";

export const useNotes = () => {
  const dispatch = useAppDispatch();
  const {
    userNotes: notes,
    selectedNote,
    loading,
    error,
    inspirationNotes,
  } = useAppSelector(selectNotes);

  const loadingInspirationRef = useRef(false);
  const loadingNotesRef = useRef(false);
  const fetchInspirationNotes = async () => {
    if (loadingInspirationRef.current) return;
    try {
      loadingInspirationRef.current = true;
      dispatch(setLoading(true));
      const response = await axios.post("/api/notes/inspiration", {
        existingNotesIds: inspirationNotes.map(note => note.id),
      });
      dispatch(setError(null));
      dispatch(
        addInspirationNotes({
          notes: response.data,
          options: { toStart: true },
        }),
      );
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "An unknown error occurred",
        ),
      );
      console.error("Error fetching notes:", error);
    } finally {
      dispatch(setLoading(false));
      loadingInspirationRef.current = false;
    }
  };

  const fetchNotes = async () => {
    if (loadingNotesRef.current) return;
    try {
      loadingNotesRef.current = true;
      dispatch(setLoading(true));
      const response = await axios.get("/api/user/notes");
      dispatch(setError(null));
      dispatch(
        addNotes({
          notes: response.data,
          options: { toStart: true },
        }),
      );
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "An unknown error occurred",
        ),
      );
      console.error("Error fetching notes:", error);
    } finally {
      dispatch(setLoading(false));
      loadingNotesRef.current = false;
    }
  };

  const selectNote = useCallback(
    (note: Note | null) => {
      dispatch(setSelectedNote(note));
    },
    [dispatch],
  );

  const generateNewNote = useCallback(async () => {
    try {
      const response = await axios.post<Note[]>("/api/notes/generate?count=1", {
        existingNotesIds: notes.map(note => note.id),
      });
      dispatch(addNotes({ notes: response.data, options: { toStart: true } }));
      selectNote(response.data[0]);
    } catch (error) {
      console.error("Error generating new note:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (inspirationNotes.length === 0) {
      fetchNotes();
    }
  }, [inspirationNotes]);

  useEffect(() => {
    if (notes.length === 0) {
      fetchInspirationNotes();
    }
  }, []);

  return {
    notes: inspirationNotes,
    selectedNote,
    loading,
    error,
    fetchNotes: fetchInspirationNotes,
    selectNote,
    generateNewNote,
  };
};

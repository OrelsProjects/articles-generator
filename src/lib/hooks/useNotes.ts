import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  selectNotes,
  setNotes,
  setLoadingNotes,
  setLoadingInspiration,
  setError,
  setSelectedNote,
  addInspirationNotes,
  addNotes,
  setSelectedImage,
  updateNote,
  removeNote,
  addNote,
} from "@/lib/features/notes/notesSlice";
import {
  Note,
  NoteDraft,
  NoteFeedback,
  NoteStatus,
  noteToNoteDraft,
} from "@/types/note";
import axios from "axios";
import { Logger } from "@/logger";
import { useUi } from "@/lib/hooks/useUi";

export const useNotes = () => {
  const { updateShowGenerateNotesSidebar } = useUi();
  const dispatch = useAppDispatch();
  const {
    userNotes,
    selectedNote,
    loadingNotes,
    loadingInspiration,
    error,
    inspirationNotes,
    selectedImage,
    hasMoreUserNotes,
    hasMoreInspirationNotes,
    userNotesCursor,
    inspirationNotesCursor,
  } = useAppSelector(selectNotes);

  const [loadingCreateDraftNote, setLoadingCreateDraftNote] = useState(false);
  const [loadingEditNote, setLoadingEditNote] = useState(false);

  const loadingInspirationRef = useRef(false);
  const loadingNotesRef = useRef(false);
  const loadingCreateNoteDraftRef = useRef(false);

  const fetchInspirationNotes = async (loadMore = false) => {
    if (loadingInspirationRef.current) return;
    try {
      loadingInspirationRef.current = true;
      dispatch(setLoadingInspiration(true));
      const response = await axios.post("/api/notes/inspiration", {
        existingNotesIds: inspirationNotes.map(note => note.id),
        cursor: loadMore ? inspirationNotesCursor : null,
      });
      dispatch(setError(null));
      if (loadMore) {
        dispatch(
          addInspirationNotes({
            items: response.data.items,
            nextCursor: response.data.nextCursor,
          }),
        );
      } else {
        dispatch(
          addInspirationNotes({
            items: response.data.items,
            nextCursor: response.data.nextCursor,
            options: { toStart: true },
          }),
        );
      }
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "An unknown error occurred",
        ),
      );
      console.error("Error fetching notes:", error);
    } finally {
      dispatch(setLoadingInspiration(false));
      loadingInspirationRef.current = false;
    }
  };

  const fetchNotes = async (loadMore = false) => {
    if (loadingNotesRef.current) return;
    try {
      loadingNotesRef.current = true;
      dispatch(setLoadingNotes(true));
      const response = await axios.get(
        `/api/user/notes${loadMore && userNotesCursor ? `?cursor=${userNotesCursor}` : ""}`,
      );
      dispatch(setError(null));
      if (loadMore) {
        dispatch(
          addNotes({
            items: response.data.items,
            nextCursor: response.data.nextCursor,
          }),
        );
      } else {
        dispatch(setNotes(response.data));
      }
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "An unknown error occurred",
        ),
      );
      console.error("Error fetching notes:", error);
    } finally {
      dispatch(setLoadingNotes(false));
      loadingNotesRef.current = false;
    }
  };

  const selectNote = useCallback(
    (
      note: Note | NoteDraft | null,
      options?: { forceShowEditor?: boolean },
    ) => {
      const noteDraft = noteToNoteDraft(note);
      if (options?.forceShowEditor) {
        updateShowGenerateNotesSidebar(true);
      }
      dispatch(setSelectedNote(noteDraft));
    },
    [dispatch],
  );

  const generateNewNotes = useCallback(async () => {
    try {
      const response = await axios.post<NoteDraft[]>("/api/notes/generate", {
        existingNotesIds: userNotes.map(note => note.id),
      });
      dispatch(
        addNotes({
          items: response.data,
          nextCursor: null,
          options: { toStart: true },
        }),
      );
      selectNote(response.data[0]);
    } catch (error) {
      console.error("Error generating new note:", error);
    }
  }, [dispatch]);

  const selectImage = useCallback(
    (image: { url: string; alt: string } | null) => {
      dispatch(setSelectedImage(image));
    },
    [dispatch],
  );

  const updateNoteStatus = useCallback(
    async (noteId: string, status: NoteStatus) => {
      try {
        await axios.delete<NoteDraft[]>(`/api/note/${noteId}`);
        if (status === "archived") {
          dispatch(removeNote(noteId));
          if (selectedNote?.id === noteId) {
            selectNote(null);
          }
        } else {
          dispatch(updateNote({ id: noteId, note: { status } }));
        }
      } catch (error: any) {
        Logger.error("Error updating status:", error);
        throw error;
      }
    },
    [userNotes],
  );

  const updateNoteFeedback = useCallback(
    async (
      noteId: string,
      feedback: NoteFeedback,
      feedbackComment?: string,
    ) => {
      let newFeedback: NoteFeedback | undefined = feedback;
      const note = userNotes.find(note => note.id === noteId);
      if (!note) return;
      let previousFeedback = note?.feedback;

      if (previousFeedback === feedback) {
        newFeedback = undefined;
      }
      dispatch(updateNote({ id: noteId, note: { feedback: newFeedback } }));

      try {
        await axios.patch<NoteDraft[]>(`/api/note/${noteId}`, {
          ...note,
          feedback: newFeedback || "undefined",
          feedbackComment: feedbackComment || "undefined",
          status: status || note.status,
        });
      } catch (error: any) {
        dispatch(
          updateNote({ id: noteId, note: { feedback: previousFeedback } }),
        );
        Logger.error("Error updating status:", error);
        throw error;
      }
    },
    [userNotes],
  );

  const editNoteBody = async (noteId: string | null, body: string) => {
    setLoadingEditNote(true);
    try {
      if (!noteId) {
        await createDraftNote({ body });
        return;
      }
      const note = userNotes.find(note => note.id === noteId);
      await axios.patch<NoteDraft[]>(`/api/note/${noteId}`, note);
      dispatch(updateNote({ id: noteId, note: { body } }));
    } catch (error: any) {
      Logger.error("Error editing note:", error);
      throw error;
    } finally {
      setLoadingEditNote(false);
    }
  };

  const createDraftNote = async (
    draft?: Partial<NoteDraft>,
  ): Promise<string | undefined> => {
    if (loadingCreateNoteDraftRef.current) return;
    loadingCreateNoteDraftRef.current = true;
    try {
      const response = await axios.post<NoteDraft>("/api/note", draft);
      dispatch(
        addNotes({
          items: [response.data],
          nextCursor: null,
          options: { toStart: true },
        }),
      );
      selectNote(response.data);
      return response.data.id;
    } catch (error: any) {
      Logger.error("Error creating draft note:", error);
      throw error;
    } finally {
      loadingCreateNoteDraftRef.current = false;
    }
  };

  return {
    inspirationNotes,
    userNotes,
    selectedNote,
    loadingNotes,
    loadingInspiration,
    error,
    fetchNotes,
    fetchInspirationNotes,
    selectNote,
    generateNewNote: generateNewNotes,
    selectedImage,
    selectImage,
    updateNoteStatus,
    updateNoteFeedback,
    hasMoreUserNotes,
    hasMoreInspirationNotes,
    loadMoreUserNotes: () => fetchNotes(true),
    loadMoreInspirationNotes: () => fetchInspirationNotes(true),
    editNoteBody,
    loadingEditNote,
    createDraftNote,
    loadingCreateDraftNote,
  };
};

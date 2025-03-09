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
  isNoteDraft,
  Note,
  NoteDraft,
  NoteFeedback,
  NoteStatus,
  noteToNoteDraft,
} from "@/types/note";
import axios from "axios";
import { Logger } from "@/logger";
import { useUi } from "@/lib/hooks/useUi";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { useCredits } from "@/lib/hooks/useCredits";

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

  const { consumeCredits } = useCredits();

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
      dispatch(
        addInspirationNotes({
          items: response.data.items,
          nextCursor: response.data.nextCursor,
          hasMore: response.data.hasMore,
          options: { toStart: false },
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
      dispatch(setLoadingInspiration(false));
      loadingInspirationRef.current = false;
    }
  };

  const fetchNotes = async (limit?: number, loadMore = false) => {
    if (loadingNotesRef.current) return;
    try {
      loadingNotesRef.current = true;
      dispatch(setLoadingNotes(true));
      const queryParams = new URLSearchParams();
      if (limit) queryParams.set("limit", limit.toString());
      if (loadMore && userNotesCursor)
        queryParams.set("cursor", userNotesCursor);

      const response = await axios.get(
        `/api/user/notes?${queryParams.toString()}`,
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
      note: Note | NoteDraft | string | null,
      options?: { forceShowEditor?: boolean },
    ) => {
      let noteToUpdate: NoteDraft | Note | null = null;
      if (typeof note === "string") {
        noteToUpdate = userNotes.find(userNote => userNote.id === note) || null;
      } else {
        noteToUpdate = note;
      }
      let noteDraft = isNoteDraft(noteToUpdate);
      if (!noteDraft) {
        noteDraft = noteToNoteDraft(noteToUpdate as Note);
      }
      if (options?.forceShowEditor) {
        updateShowGenerateNotesSidebar(true);
      }
      dispatch(setSelectedNote(noteDraft));
    },
    [dispatch],
  );

  const generateNewNotes = useCallback(async () => {
    try {
      const response = await axios.post<AIUsageResponse<NoteDraft[]>>(
        "/api/notes/generate",
        {
          existingNotesIds: userNotes.map(note => note.id),
        },
      );
      const { responseBody } = response.data;
      if (!responseBody) {
        throw new Error("No notes generated");
      }

      const { body, creditsUsed } = responseBody;
      if (!body) {
        throw new Error("No notes generated");
      }

      consumeCredits(creditsUsed);

      dispatch(
        addNotes({
          items: body,
          nextCursor: null,
          options: { toStart: true },
        }),
      );

      selectNote(body[0]);
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
      const previousStatus = userNotes.find(note => note.id === noteId)?.status;
      if (!previousStatus) {
        Logger.error("Note not found");
        throw new Error("Note not found");
      }
      try {
        if (status === "archived") {
          dispatch(removeNote(noteId));
          if (selectedNote?.id === noteId) {
            selectNote(null);
          }
        } else {
          dispatch(updateNote({ id: noteId, note: { status } }));
        }
        await axios.patch<NoteDraft[]>(`/api/note/${noteId}`, {
          status: status,
        });
      } catch (error: any) {
        Logger.error("Error updating status:", error);
        dispatch(updateNote({ id: noteId, note: { status: previousStatus } }));
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
          feedback: newFeedback || null,
          feedbackComment: feedbackComment || null,
          status: note.status || null,
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
      debugger;
      if (!noteId) {
        await createDraftNote({ body });
        return;
      }
      const partialNote: Partial<NoteDraft> = { body };
      await axios.patch<NoteDraft[]>(`/api/note/${noteId}`, partialNote);
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
    generateNewNotes,
    selectedImage,
    selectImage,
    updateNoteStatus,
    updateNoteFeedback,
    hasMoreUserNotes,
    hasMoreInspirationNotes,
    loadMoreUserNotes: () => fetchNotes(),
    loadMoreInspirationNotes: () => fetchInspirationNotes(true),
    editNoteBody,
    loadingEditNote,
    createDraftNote,
  };
};

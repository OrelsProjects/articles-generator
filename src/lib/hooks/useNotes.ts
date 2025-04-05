import { useCallback, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  selectNotes,
  setNotes,
  setLoadingNotes,
  setError,
  setSelectedNote,
  addNotes,
  setSelectedImage,
  updateNote,
  removeNote,
  setLoadingNotesGenerate,
  setErrorGenerateNotes,
  setHandle,
  setThumbnail,
  setLoadingFetchingByline,
  setName,
} from "@/lib/features/notes/notesSlice";
import {
  isNoteDraft,
  Note,
  NoteDraft,
  NoteFeedback,
  NoteStatus,
  noteToNoteDraft,
} from "@/types/note";
import axios, { AxiosError } from "axios";
import { Logger } from "@/logger";
import { useUi } from "@/lib/hooks/useUi";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { useCredits } from "@/lib/hooks/useCredits";
import { EventTracker } from "@/eventTracker";
import { decrementUsage } from "@/lib/features/settings/settingsSlice";
import { ImprovementType } from "@/lib/prompts";
import { debounce } from "lodash";
import { Byline } from "@/types/article";

export const useNotes = () => {
  const { updateShowGenerateNotesSidebar, updateShowScheduleModal } = useUi();
  const dispatch = useAppDispatch();
  const {
    userNotes,
    selectedNote,
    loadingNotes,
    error,
    selectedImage,
    hasMoreUserNotes,
    userNotesCursor,
    handle,
    thumbnail,
    loadingFetchingByline,
    errorGenerateNotes,
    loadingNotesGenerate,
  } = useAppSelector(selectNotes);

  const { consumeCredits } = useCredits();
  const [loadingEditNote, setLoadingEditNote] = useState(false);

  const loadingNotesRef = useRef(false);
  const loadingCreateNoteDraftRef = useRef(false);
  const cancelRef = useRef<AbortController | null>(null);

  const fetchNotes = async (limit?: number, loadMore = false) => {
    if (loadingNotesRef.current) return;
    try {
      if (userNotes.length > 0) {
        EventTracker.track("notes_user_load_more");
      }
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
      options?: {
        forceShowEditor?: boolean;
        isFromInspiration?: boolean;
        hasChanges?: boolean;
        showScheduleModal?: boolean;
      },
    ) => {
      if (options?.hasChanges) {
        // show alert window
        const confirm = window.confirm(
          "You have unsaved changes. Are you sure you want to change note?",
        );
        if (!confirm) {
          return;
        }
      }
      EventTracker.track("notes_select_note");
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
      // if (options?.forceShowEditor) {
      //   updateShowGenerateNotesSidebar(true);
      // }
      dispatch(
        setSelectedNote({
          note: noteDraft,
          isFromInspiration: options?.isFromInspiration,
        }),
      );
      if (options?.showScheduleModal) {
        updateShowScheduleModal(true);
      }
    },
    [userNotes],
  );

  const generateNewNotes = useCallback(
    async (model?: string, options?: { useTopTypes?: boolean }) => {
      try {
        dispatch(setLoadingNotesGenerate(true));
        EventTracker.track("notes_generate_new_notes", { model });
        const response = await axios.post<AIUsageResponse<NoteDraft[]>>(
          "/api/notes/generate",
          {
            existingNotesIds: userNotes.map(note => note.id),
            model,
            ...options,
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
        if (!selectedNote) {
          selectNote(body[0]);
        }
      } catch (error) {
        // if error is 429, set errorGenerateNotes
        if (error instanceof AxiosError) {
          const code = error.response?.status;
          if (code === 429) {
            dispatch(
              setErrorGenerateNotes({
                message:
                  "Seems like the model you chose is not available right now. Try a different one.",
                hideAfter: 5000,
              }),
            );
          } else if (code === 402) {
            setErrorGenerateNotes({
              message: "You ran out of credits.",
              hideAfter: 5000,
            });
          }
        }
        console.error("Error generating new note:", error);
      } finally {
        dispatch(setLoadingNotesGenerate(false));
      }
    },
    [userNotes, selectedNote, selectNote, consumeCredits, dispatch],
  );

  const selectImage = useCallback(
    (image: { url: string; alt: string } | null) => {
      dispatch(setSelectedImage(image));
    },
    [dispatch],
  );

  const updateNoteStatus = useCallback(
    async (noteId: string, status: NoteStatus | "archived") => {
      setLoadingEditNote(true);
      EventTracker.track("notes_update_note_status_" + status);
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
        const body = status === "archived" ? { isArchived: true } : { status };
        
        if (previousStatus === "scheduled") {
          await axios.delete(`/api/user/notes/${noteId}/schedule`, {
            params: { status },
          });
        } else {
          await axios.patch<NoteDraft[]>(`/api/note/${noteId}`, body);
        }
      } catch (error: any) {
        Logger.error("Error updating status:", error);
        dispatch(updateNote({ id: noteId, note: { status: previousStatus } }));
        throw error;
      } finally {
        setLoadingEditNote(false);
      }
    },
    [userNotes, selectedNote, selectNote, dispatch],
  );

  const updateNoteFeedback = useCallback(
    async (noteId: string, feedback: NoteFeedback, feedbackReason?: string) => {
      EventTracker.track("notes_update_note_feedback", {
        feedback,
        feedbackReason,
      });

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
          feedbackComment: feedbackReason || null,
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
    [userNotes, dispatch],
  );

  const editNoteBody = async (noteId: string | null, body: string) => {
    const controller = new AbortController();
    cancelRef.current = controller;

    EventTracker.track("notes_edit_note_body");
    setLoadingEditNote(true);

    try {
      if (!noteId) {
        await createDraftNote({ body });
        return;
      }
      const partialNote: Partial<NoteDraft> = { body };
      await axios.patch<NoteDraft[]>(`/api/note/${noteId}`, partialNote, {
        signal: controller.signal,
      });
      dispatch(updateNote({ id: noteId, note: { body } }));
    } catch (error: any) {
      if (error instanceof AxiosError && error.code === "ERR_CANCELED") return;
      Logger.error("Error editing note:", error);
      throw error;
    } finally {
      setLoadingEditNote(false);
    }
  };

  const updateNoteBodyDebounced = useCallback(
    debounce((noteId, body) => {
      editNoteBody(noteId, body);
    }, 2500),
    [],
  );

  const updateNoteBody = (
    noteId: string | null,
    body: string,
    options?: { immediate?: boolean },
  ) => {
    // Abort any existing request
    if (cancelRef.current) {
      cancelRef.current.abort();
      cancelRef.current = null;
    }
    if (options?.immediate) {
      editNoteBody(noteId, body);
    } else {
      updateNoteBodyDebounced(noteId, body);
    }
  };

  const createDraftNote = async (
    draft?: Partial<NoteDraft>,
  ): Promise<string | undefined> => {
    EventTracker.track("notes_create_draft_note");
    if (loadingCreateNoteDraftRef.current) return;
    loadingCreateNoteDraftRef.current = true;
    try {
      const response = await axios.post<NoteDraft>(
        "/api/note",
        draft || { body: "" },
      );
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

  const improveText = async (
    text: string,
    type: ImprovementType,
    noteId: string | null,
    model?: string,
  ): Promise<{ text: string } | null> => {
    EventTracker.track("idea_improve_text_" + type, {
      length: text.length,
      model,
    });
    const res = await axios.post<AIUsageResponse<string>>("/api/note/improve", {
      text,
      type,
      noteId,
      model,
    });
    const { responseBody } = res.data;
    if (!responseBody) {
      throw new Error("No text improved");
    }
    const { body, creditsUsed } = responseBody;

    dispatch(decrementUsage({ amount: creditsUsed }));
    if (noteId) {
      dispatch(updateNote({ id: noteId, note: { body } }));
    }
    editNoteBody(noteId, body);
    return body
      ? {
          text: body,
        }
      : null;
  };

  const getNoteByNoteId = useCallback(async (noteId: string) => {
    try {
      const response = await axios.get<NoteDraft>(`/api/user/notes/${noteId}`);
      return response.data;
    } catch (error: any) {
      return null;
    }
  }, []);

  const updateByline = useCallback(async () => {
    if (loadingFetchingByline) return;

    if (!handle && !thumbnail) {
      dispatch(setLoadingFetchingByline(true));
      try {
        const response = await axios.get<Byline>("/api/user/byline");
        dispatch(setHandle(response.data.handle));
        dispatch(setThumbnail(response.data.photoUrl));
        dispatch(setName(response.data.name));
        dispatch(setLoadingFetchingByline(false));
      } catch (error: any) {
        Logger.error("Error fetching byline:", error);
        dispatch(setLoadingFetchingByline(false));
      }
    }
  }, [handle, thumbnail]);

  return {
    userNotes,
    selectedNote,
    loadingNotes,
    error,
    fetchNotes,
    selectNote,
    generateNewNotes,
    selectedImage,
    selectImage,
    updateNoteStatus,
    updateNoteFeedback,
    hasMoreUserNotes,
    loadMoreUserNotes: () => fetchNotes(),
    updateNoteBody,
    loadingEditNote,
    createDraftNote,
    improveText,
    isLoadingGenerateNotes: loadingNotesGenerate,
    errorGenerateNotes,
    getNoteByNoteId,
    updateByline,
    editNoteBody,
  };
};

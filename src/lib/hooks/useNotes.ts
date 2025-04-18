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
  removeAttachmentFromNote,
  addAttachmentToNote,
  addNote,
} from "@/lib/features/notes/notesSlice";
import {
  isEmptyNote,
  isNoteDraft,
  Note,
  NOTE_EMPTY,
  NoteDraft,
  NoteDraftImage,
  NoteFeedback,
  NoteStatus,
  inspirationNoteToNoteDraft,
  NoteDraftBody,
  NoteId,
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
import { selectAuth } from "@/lib/features/auth/authSlice";
import { CreatePostResponse } from "@/types/createPostResponse";
import { CancelError } from "@/types/errors/CancelError";
import {
  createNoteDraft,
  extensionApiRequest,
  updateNoteDraft,
} from "@/lib/api/api";
import { useExtension } from "@/lib/hooks/useExtension";

export const useNotes = () => {
  const { user } = useAppSelector(selectAuth);
  const { updateShowScheduleModal, hasAdvancedGPT } = useUi();
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
  // Don't delete, it works for some reason and allows user to save on click. TODO: Check why
  const [, setShouldCancelUpdate] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingSendNote, setLoadingSendNote] = useState(false);
  const { sendExtensionApiRequest } = useExtension();

  const loadingCreateNote = useRef(false);
  const loadingNotesRef = useRef(false);
  const cancelRef = useRef<AbortController | null>(null);
  const cancelUpdateBody = useRef<NoteId[]>([]);

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
        showScheduleModal?: boolean;
      },
    ) => {
      EventTracker.track("notes_select_note");
      let noteToUpdate: NoteDraft | Note | null = null;
      if (typeof note === "string") {
        noteToUpdate = userNotes.find(userNote => userNote.id === note) || null;
      } else {
        noteToUpdate = note;
      }
      let noteDraft = isNoteDraft(noteToUpdate);
      if (!noteDraft) {
        noteDraft = inspirationNoteToNoteDraft(noteToUpdate as Note);
      }
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
    async (
      model?: string,
      options?: { useTopTypes?: boolean; topic?: string },
    ) => {
      try {
        dispatch(setLoadingNotesGenerate(true));
        const validOptions = {
          ...options,
          useTopTypes: hasAdvancedGPT ? options?.useTopTypes : false,
          model: hasAdvancedGPT ? model : undefined,
        };
        EventTracker.track("notes_generate_new_notes", { model });
        const response = await axios.post<AIUsageResponse<NoteDraft[]>>(
          "/api/notes/generate",
          {
            existingNotesIds: userNotes.map(note => note.id),
            ...validOptions,
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
      EventTracker.track("notes_update_note_status_" + status);
      const previousNote = userNotes.find(note => note.id === noteId);
      const previousStatus = previousNote?.status;
      if (!previousNote) {
        Logger.error("Note not found");
        throw new Error("Note not found");
      }
      try {
        if (status === "archived") {
          dispatch(removeNote(noteId));
          if (selectedNote?.id === noteId) {
            selectNote(null);
          }
        }
        const body = status === "archived" ? { isArchived: true } : { status };

        if (previousStatus === "scheduled") {
          await sendExtensionApiRequest("schedule-delete", {
            noteId,
            status,
          });
          dispatch(updateNote({ id: noteId, note: { status: "draft" } }));
        } else {
          // Previous status is not scheduled, so it can be published/draft
          const validStatus = status === "archived" ? "draft" : status;
          dispatch(updateNote({ id: noteId, note: { status: validStatus } }));
          await axios.patch<NoteDraft[]>(`/api/note/${noteId}`, body);
        }
      } catch (error: any) {
        Logger.error("Error updating status:", error);
        if (status === "archived") {
          dispatch(addNote(previousNote));
        } else {
          dispatch(
            updateNote({ id: noteId, note: { status: previousStatus } }),
          );
        }
        throw error;
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

  const editNoteBody = async (
    noteId: string | null,
    body: string,
  ): Promise<NoteDraft | null> => {
    if (noteId && cancelUpdateBody.current.includes(noteId)) {
      cancelUpdateBody.current = cancelUpdateBody.current.filter(
        id => id !== noteId,
      );
      return null;
    }

    const canUpdate = selectedNote?.id === noteId && !loadingCreateNote.current;

    if (!canUpdate) {
      return null;
    }

    cancelRef.current?.abort();
    const controller = new AbortController();
    cancelRef.current = controller;
    let isCanceled = false;

    EventTracker.track("notes_edit_note_body");
    setLoadingEditNote(true);

    try {
      const isEmpty = isEmptyNote(selectedNote);
      if (isEmpty) {
        loadingCreateNote.current = true;
        // It's a note from the inspiration apge, we need to create a user note first.
        try {
          const data = await createNoteDraft(
            {
              body,
              status:
                selectedNote?.status === "inspiration"
                  ? "draft"
                  : selectedNote?.status,
            },
            { signal: controller.signal },
          );
          dispatch(
            addNotes({
              items: [data],
              nextCursor: null,
              options: { toStart: true },
            }),
          );
          dispatch(setSelectedNote({ note: data }));
          cancelRef.current = null;
          return data;
        } catch (error: any) {
          throw error;
        } finally {
          loadingCreateNote.current = false;
        }
      } else {
        if (!noteId) {
          throw new Error("Note ID is null");
        }
        const partialNote: Partial<NoteDraftBody> = { body };
        await updateNoteDraft(noteId, partialNote, {
          signal: controller.signal,
        });
        const note = userNotes.find(note => note.id === noteId);
        dispatch(updateNote({ id: noteId, note: { body } }));
        cancelRef.current = null;
        return note
          ? {
              ...note,
              body,
            }
          : null;
      }
    } catch (error: any) {
      if (error instanceof AxiosError && error.code === "ERR_CANCELED") {
        // throw new CancelError("Cancelled");
        Logger.error("Error editing note:", error);
        isCanceled = true;
        return null;
      }
      throw error;
    } finally {
      if (!isCanceled) {
        setLoadingEditNote(false);
      }
    }
  };

  const updateNoteBodyDebounced = useCallback(
    debounce((noteId, body) => {
      editNoteBody(noteId, body);
    }, 200),
    [selectedNote],
  );

  const updateNoteBody = (
    noteId: string | null,
    body: string,
    options?: { immediate?: boolean },
  ) => {
    // Abort any existing request
    try {
      if (cancelRef.current) {
        cancelRef.current.abort();
        cancelRef.current = null;
        setShouldCancelUpdate(false);
      }
    } catch (error: any) {
      Logger.error("Error updating note body:", error);
      return;
    }
    if (options?.immediate) {
      editNoteBody(noteId, body);
    } else {
      updateNoteBodyDebounced(noteId, body);
    }
  };

  const cancelUpdateNoteBody = (noteId: NoteId, shouldCancel = true) => {
    if (shouldCancel) {
      cancelUpdateBody.current = [...cancelUpdateBody.current, noteId];
    } else {
      cancelUpdateBody.current = cancelUpdateBody.current.filter(
        id => id !== noteId,
      );
    }
  };

  const createDraftNote = async (draft?: Partial<NoteDraft>): Promise<void> => {
    EventTracker.track("notes_create_draft_note");
    selectNote({ ...NOTE_EMPTY, ...draft });
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
    try {
      editNoteBody(noteId, body);
    } catch (error: any) {
      if (error instanceof CancelError) {
        return null;
      }
      throw error;
    }
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

  const deleteImage = useCallback(
    async (noteId: string, attachment: NoteDraftImage) => {
      try {
        dispatch(
          removeAttachmentFromNote({
            noteId,
            attachmentId: attachment.id,
          }),
        );
        await axios.delete(`/api/note/${noteId}/image/${attachment.id}`);
      } catch (error) {
        dispatch(addAttachmentToNote({ noteId, attachment }));
        console.error("Error deleting image:", error);
        throw error;
      }
    },
    [dispatch],
  );

  const uploadFile = async (file: File, noteId: string) => {
    if (uploadingFile) return;
    try {
      const existingNote = userNotes.find(note => note.id === noteId);

      if (
        existingNote?.attachments?.length &&
        existingNote.attachments.length >= 1
      ) {
        const shouldDelete = window.confirm(
          "Are you sure you want to replace the existing image?",
        );
        if (shouldDelete) {
          const existingNote = userNotes.find(note => note.id === noteId);
          if (
            existingNote?.attachments?.length &&
            existingNote.attachments.length >= 1
          ) {
            await deleteImage(noteId, existingNote.attachments[0]);
          }
        } else {
          return;
        }
      }

      // make data to send to the server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);

      setUploadingFile(true);

      const response = await axios.post<NoteDraftImage>(
        `/api/note/${noteId}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      if (noteId) {
        // Update the note with the image URL from the response
        dispatch(
          addAttachmentToNote({
            noteId,
            attachment: response.data,
          }),
        );
      }
      return response.data;
    } catch (error: any) {
      Logger.error("Error uploading file:", error);
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  const sendNote = useCallback(
    async (noteId: string) => {
      if (!user) return;
      try {
        setLoadingSendNote(true);
        const response = await sendExtensionApiRequest("send", {
          noteId,
          userId: user.userId,
        });
        return response.data.result;
      } catch (error: any) {
        Logger.error("Error sending note:", error);
        throw error;
      } finally {
        setLoadingSendNote(false);
      }
    },
    [user],
  );

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
    uploadFile,
    uploadingFile,
    cancelUpdateNoteBody,
    deleteImage,
    sendNote,
    loadingSendNote,
  };
};

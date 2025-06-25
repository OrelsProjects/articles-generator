import { useCallback, useMemo, useRef, useState } from "react";
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
  setFirstLoadingNotes,
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
import { AxiosError } from "axios";
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
import { CancelError } from "@/types/errors/CancelError";
import { createNoteDraft, updateNoteDraft } from "@/lib/api/api";
import { useExtension } from "@/lib/hooks/useExtension";
import { toast } from "react-toastify";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { setNotePostedData } from "@/lib/features/ui/uiSlice";
import { ScheduleNotFoundError } from "@/types/errors/ScheduleNotFoundError";
import axiosInstance from "@/lib/axios-instance";
import {
  CHUNK_SIZE,
  MAX_FILE_SIZE,
  MIN_EXTENSION_TO_UPLOAD_LINK,
} from "@/lib/consts";
import { NoteWithEngagementStats } from "@/types/notes-stats";
import { AttachmentType } from "@prisma/client";
import { OpenGraphResponse } from "@/types/og";
import { getLinks } from "@/lib/utils/note-editor-utils";
import { compareVersions } from "@/lib/utils/extension";

export const MAX_ATTACHMENTS = Math.ceil(MAX_FILE_SIZE / CHUNK_SIZE);

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
    firstLoadingNotes,
  } = useAppSelector(selectNotes);

  const { consumeCredits } = useCredits();
  const [loadingEditNote, setLoadingEditNote] = useState(false);
  const [loadingCreateNote, setLoadingCreateNote] = useState(false);
  // Don't delete, it works for some reason and allows user to save on click. TODO: Check why
  const [, setShouldCancelUpdate] = useState(false);
  const [uploadingFilesCount, setUploadingFilesCount] = useState(0);
  const [loadingSendNote, setLoadingSendNote] = useState(false);
  const { sendNote: sendNoteExtension, hasExtension } = useExtension();
  const {
    deleteSchedule,
    scheduleNote: createSchedule,
    loadingScheduleNote,
  } = useNotesSchedule();

  const loadingCreateNoteRef = useRef(false);
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

      const response = await axiosInstance.get(
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
      Logger.error("Error fetching notes:", { error: String(error) });
    } finally {
      dispatch(setLoadingNotes(false));
      if (firstLoadingNotes) {
        dispatch(setFirstLoadingNotes(false));
      }
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
      options?: {
        useTopTypes?: boolean;
        topic?: string;
        preSelectedPostIds?: string[];
      },
    ) => {
      try {
        dispatch(setLoadingNotesGenerate(true));
        const validOptions = {
          ...options,
          useTopTypes: hasAdvancedGPT ? options?.useTopTypes : false,
          model: hasAdvancedGPT ? model : undefined,
          preSelectedPostIds: options?.preSelectedPostIds || [],
        };

        EventTracker.track("notes_generate_new_notes", { model });
        const response = await axiosInstance.post<AIUsageResponse<NoteDraft[]>>(
          "/api/notes/generate",
          {
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
            options: { toStart: true, notification: true },
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
            throw new Error("Not enough credits");
          }
        }
        Logger.error("Error generating new note:", { error: String(error) });
        throw new Error("Something went wrong, no credits were used");
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
    async (
      noteId: string,
      status: NoteStatus | "archived",
      scheduledTo?: Date,
    ) => {
      EventTracker.track("notes_update_note_status_" + status);
      const previousNote = userNotes.find(note => note.id === noteId);
      const previousStatus = previousNote?.status;
      if (!previousNote) {
        Logger.error("Note not found");
        throw new Error("Note not found");
      }
      try {
        const body: {
          isArchived?: boolean;
          status?: NoteStatus;
          scheduledTo?: Date;
        } = status === "archived" ? { isArchived: true } : { status };

        if (
          previousStatus === "scheduled" &&
          (status !== "scheduled" || body.isArchived)
        ) {
          Logger.info(
            "[UPDATE-NOTE-STATUS] Deleting schedule for note: " + noteId,
          );
          await deleteSchedule(noteId, { throwIfNotFound: false });
        } else {
          // Previous status is not scheduled, so it can be published/draft
          if (scheduledTo) {
            body.scheduledTo = scheduledTo;
          }
        }
        await axiosInstance.patch<NoteDraft[]>(`/api/note/${noteId}`, body);
        if (status === "archived") {
          dispatch(removeNote(noteId));
          if (selectedNote?.id === noteId) {
            selectNote(null);
          }
        } else {
          dispatch(updateNote({ id: noteId, note: { ...body } }));
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
        await axiosInstance.patch<NoteDraft[]>(`/api/note/${noteId}`, {
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

    const canUpdate =
      selectedNote?.id === noteId && !loadingCreateNoteRef.current;
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
      const isInspiration = selectedNote?.status === "inspiration";
      const isAiGenerated = selectedNote?.status === "chat-generated";
      if (isEmpty || isInspiration || isAiGenerated) {
        // It's a note from the inspiration apge, we need to create a user note first.
        loadingCreateNoteRef.current = true;
        try {
          const data = await createNoteDraft(
            {
              body,
              status:
                selectedNote?.status === "inspiration" ||
                selectedNote?.status === "chat-generated"
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
          loadingCreateNoteRef.current = false;
        }
      } else {
        // It's a draft note from the user. We need to update the note body.
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

        const hasLinkAttachments = note?.attachments?.some(
          attachment => attachment.type === AttachmentType.link,
        );

        if (!hasLinkAttachments) {
          const extensionVersion = user?.meta?.extensionVersion;
          const extensionVersionCompare = compareVersions(
            extensionVersion || "",
            MIN_EXTENSION_TO_UPLOAD_LINK,
          );
          if (
            extensionVersionCompare === "biggerThen" ||
            extensionVersionCompare === "equal"
          ) {
            const links = getLinks(body);
            if (links.length > 0) {
              const link = links[0];

              const { og, ...attachment } = await uploadLink(noteId, link);
              dispatch(addAttachmentToNote({ noteId, attachment }));
            }
          }
        }

        return note
          ? {
              ...note,
              body,
            }
          : null;
      }
    } catch (error: any) {
      if (error instanceof AxiosError && error.code === "ERR_CANCELED") {
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
    if (loadingCreateNoteRef.current) return;
    try {
      loadingCreateNoteRef.current = true;
      setLoadingCreateNote(true);
      const response = await axiosInstance.post<NoteDraft>("/api/note", {
        ...draft,
      });
      dispatch(
        addNotes({
          items: [response.data],
          nextCursor: null,
          options: {
            notification: true,
          },
        }),
      );
      selectNote(response.data);
    } catch (error: any) {
      Logger.error("Error creating draft note:", error);
      throw error;
    } finally {
      setLoadingCreateNote(false);
      loadingCreateNoteRef.current = false;
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
    const res = await axiosInstance.post<AIUsageResponse<string>>(
      "/api/note/improve",
      {
        text,
        type,
        noteId,
        model,
      },
    );
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
      const response = await axiosInstance.get<NoteDraft>(
        `/api/user/notes/${noteId}`,
      );
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
        const response = await axiosInstance.get<Byline>("/api/user/byline");
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
        await axiosInstance.delete(
          `/api/note/${noteId}/image/${attachment.id}`,
        );
      } catch (error) {
        dispatch(addAttachmentToNote({ noteId, attachment }));
        Logger.error("Error deleting image:", { error: String(error) });
        throw error;
      }
    },
    [dispatch],
  );

  const getOgData = async (url: string) => {
    try {
      const response = await axiosInstance.post<OpenGraphResponse>(
        "/api/v1/og",
        { url },
      );
      return response.data;
    } catch (error: any) {
      Logger.error("Error getting OG data:", error);
      throw error;
    }
  };

  const uploadLink = async (
    noteId: string,
    url: string,
  ): Promise<NoteDraftImage & { og: OpenGraphResponse }> => {
    const formData = new FormData();
    formData.append("url", url);
    formData.append("type", AttachmentType.link);
    try {
      const response = await axiosInstance.post<{
        og: OpenGraphResponse;
        attachment: NoteDraftImage;
      }>(`/api/note/${noteId}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const { og, attachment } = response.data;
      return { ...attachment, og };
    } catch (error: any) {
      Logger.error("Error uploading link:", error);
      throw error;
    }
  };

  const uploadFile = async (
    files: File[],
    noteId: string,
  ): Promise<NoteDraftImage[]> => {
    if (uploadingFilesCount >= MAX_ATTACHMENTS) {
      throw new Error(`Only ${MAX_ATTACHMENTS} images allowed`);
    }
    let filesUploading = 0;

    try {
      const existingNote = userNotes.find(note => note.id === noteId);
      const currentAttachments = existingNote?.attachments || [];

      if (currentAttachments.length >= MAX_ATTACHMENTS) {
        throw new Error(`Only ${MAX_ATTACHMENTS} images allowed`);
      }

      const maxAllowedAttachments = MAX_ATTACHMENTS - currentAttachments.length;
      const attachmentsToUpload = files.slice(0, maxAllowedAttachments);
      filesUploading = attachmentsToUpload.length;
      setUploadingFilesCount(filesUploading);
      const uploadedFiles: NoteDraftImage[] = [];

      console.log("attachmentsToUpload", attachmentsToUpload.length);

      for (const file of attachmentsToUpload) {
        try {
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          const fileId = crypto.randomUUID(); // Generate unique ID for this file upload

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append("file", chunk);
            formData.append("fileName", file.name);
            formData.append("fileId", fileId);
            formData.append("chunkIndex", chunkIndex.toString());
            formData.append("totalChunks", totalChunks.toString());
            formData.append("fileSize", file.size.toString());
            formData.append("mimeType", file.type);

            const response = await axiosInstance.post<NoteDraftImage>(
              `/api/note/${noteId}/image`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              },
            );

            // Only process the response on the last chunk
            if (chunkIndex === totalChunks - 1 && response.data) {
              if (noteId) {
                dispatch(
                  addAttachmentToNote({
                    noteId,
                    attachment: response.data,
                  }),
                );
                uploadedFiles.push(response.data);
              }
            }
          }
        } catch (error: any) {
          Logger.error("Error uploading file:", error);
          throw error;
        } finally {
          setUploadingFilesCount(prev => prev - 1);
        }
      }
      return uploadedFiles;
    } catch (error: any) {
      Logger.error("Error uploading all files:", error);
      throw error;
    }
  };

  const sendNote = useCallback(
    async (noteId: string) => {
      if (!user) return;
      let sendResponse: any;
      try {
        await hasExtension({
          throwIfNoExtension: true,
          showDialog: true,
        });
        setLoadingSendNote(true);
        const note = userNotes.find(note => note.id === noteId);
        if (!note) return;
        // await axiosInstance.get(`/api/user/notes/${noteId}/should-send`);
        Logger.info("Sending note", note);

        const attachments: {
          url: string;
          type: AttachmentType;
        }[] = [];

        if (note.attachments?.length) {
          note.attachments.forEach(attachment => {
            attachments.push({
              url: attachment.url,
              type: attachment.type,
            });
          });
        }
        Logger.info("Attachment URLs", attachments);
        const body =
          attachments.length > 0
            ? {
                message: note.body,
                moveNoteToPublished: {
                  noteId,
                },
                attachments,
              }
            : {
                message: note.body,
                moveNoteToPublished: {
                  noteId,
                },
              };
        Logger.info("Body", body);

        const response = await sendNoteExtension(body);
        sendResponse = response;
      } catch (error: any) {
        Logger.error("Error sending note:", error);
        throw error;
      } finally {
        setLoadingSendNote(false);
      }
      try {
        await updateNoteStatus(noteId, "published");
      } catch (error: any) {
        Logger.error("Error updating note status:", error);
        toast.error(
          "Your note was sent but schedule didn't cancel. Please, cancel it manually in the app.",
        );
      }

      dispatch(setNotePostedData(sendResponse));

      return sendResponse;
    },
    [user, userNotes, selectedNote, selectNote, updateNoteStatus, dispatch],
  );

  const scheduleNote = useCallback(
    async (
      note: NoteDraft,
      scheduledTo: Date,
      options?: {
        considerSeconds?: boolean;
        showToast?: boolean;
      },
    ) => {
      try {
        Logger.info("ADDING-SCHEDULE: scheduleNote", {
          note,
          scheduledTo,
          options,
        });
        let validScheduledTo = new Date(scheduledTo);
        if (!options?.considerSeconds) {
          // reset seconds to 0
          validScheduledTo = new Date(
            validScheduledTo.getFullYear(),
            validScheduledTo.getMonth(),
            validScheduledTo.getDate(),
            validScheduledTo.getHours(),
            validScheduledTo.getMinutes(),
            0,
          );
        }
        Logger.info("ADDING-SCHEDULE: scheduleNote: validScheduledTo", {
          validScheduledTo,
        });
        await createSchedule(
          {
            ...note,
            scheduledTo: validScheduledTo,
          },
          {
            showToast: options?.showToast,
          },
        );
        Logger.info("ADDING-SCHEDULE: scheduleNote: created schedule");
        await updateNoteStatus(note.id, "scheduled", scheduledTo);
        Logger.info("ADDING-SCHEDULE: scheduleNote: updated note status", {
          note,
        });
      } catch (error: any) {
        Logger.error("Error scheduling note:", error);
        throw error;
      }
    },
    [createSchedule, updateNoteStatus],
  );

  const rescheduleNote = useCallback(
    async (
      noteId: string,
      newTime: Date,
      options?: { showToast?: boolean },
    ) => {
      const note = userNotes.find(note => note.id === noteId);
      try {
        if (!note) {
          throw new Error("Note not found");
        }
        try {
          await deleteSchedule(noteId);
        } catch (error: any) {
          // If the schedule is not found, it's ok, we can continue
          if (error instanceof ScheduleNotFoundError) {
            Logger.error("Error deleting schedule:", error);
          } else {
            throw error;
          }
        }
        await scheduleNote(note, newTime, {
          showToast: options?.showToast,
        });
        await updateNoteStatus(noteId, "scheduled", newTime);
      } catch (error: any) {
        Logger.error(
          `Error rescheduling note: ${noteId}, ${error}, ${newTime}`,
          { error: String(error) },
        );
        throw error;
      }
    },
    [scheduleNote, deleteSchedule],
  );

  const notesToGenerate = useMemo(() => {
    return user?.meta?.notesToGenerateCount || 3;
  }, [user]);

  const fetchNotesForDate = useCallback(
    async (date: string): Promise<NoteWithEngagementStats[]> => {
      try {
        const response = await axiosInstance.get<NoteWithEngagementStats[]>(
          `/api/user/notes/stats/engagement/${date}`,
        );
        return response.data;
      } catch (error) {
        Logger.error("Error fetching notes for date:", {
          error: String(error),
          date,
        });
        throw error;
      }
    },
    [],
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
    uploadingFilesCount,
    cancelUpdateNoteBody,
    deleteImage,
    sendNote,
    loadingSendNote,
    scheduleNote,
    loadingScheduleNote,
    rescheduleNote,
    loadingCreateNote,
    notesToGenerate,
    fetchNotesForDate,
    uploadLink,
    getOgData,
    firstLoadingNotes,
  };
};

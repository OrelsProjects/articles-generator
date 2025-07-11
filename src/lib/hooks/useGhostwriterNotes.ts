import { useCallback, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  selectGhostwriter,
  setSelectedClientId,
  setClientNotesLoading,
  setClientNotesError,
  setClientNotes,
  addClientNote,
  updateClientNote,
  removeClientNote,
  setSelectedClientNote,
  setClientSchedules,
  setClientSchedulesError,
  setClientSchedulesLoading,
  addClientSchedule,
  removeClientSchedule,
  updateClientSchedule,
} from "@/lib/features/ghostwriter/ghostwriterSlice";
import {
  isEmptyNote,
  isNoteDraft,
  Note,
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
import { createNoteDraft, updateNoteDraft } from "@/lib/api/api-ghostwriter";
import axiosInstance from "@/lib/axios-instance";
import { JSONContent } from "@tiptap/react";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { CancelError } from "@/types/errors/CancelError";
import { CHUNK_SIZE, MAX_FILE_SIZE } from "@/lib/consts";
import { NoteWithEngagementStats } from "@/types/notes-stats";
import { AttachmentType } from "@prisma/client";
import { OpenGraphResponse } from "@/types/og";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { CreateUserSchedule, UserSchedule } from "@/types/schedule";
import { ScheduleExistsError } from "@/lib/errors/ScheduleExistsError";

export const MAX_ATTACHMENTS = Math.ceil(MAX_FILE_SIZE / CHUNK_SIZE);

export const useGhostwriterNotes = () => {
  const [lastSelectedClientId, setLastSelectedClientId] = useLocalStorage<
    string | null
  >("last_selected_client_id", null);
  const { user } = useAppSelector(selectAuth);
  const { hasAdvancedGPT } = useUi();
  const dispatch = useAppDispatch();
  const {
    clientNotes,
    selectedClientId,
    clientNotesLoading,
    clientNotesError,
    selectedClientNote,
    clientList,
    clientSchedules,
    clientSchedulesLoading,
  } = useAppSelector(selectGhostwriter);

  const { consumeCredits } = useCredits();
  const [loadingEditNote, setLoadingEditNote] = useState(false);
  const [loadingCreateNote, setLoadingCreateNote] = useState(false);
  const [loadingNotesGenerate, setLoadingNotesGenerate] = useState(false);
  const [errorGenerateNotes, setErrorGenerateNotes] = useState<string | null>(
    null,
  );
  const [uploadingFilesCount, setUploadingFilesCount] = useState(0);
  const [loadingScheduleNote, setLoadingScheduleNote] = useState(false);

  const [loadingScheduleDay, setLoadingScheduleDay] = useState<string | null>(
    null,
  );
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingAddSchedule, setLoadingAddSchedule] = useState(false);

  const cancelUpdateBody = useRef<NoteId[]>([]);

  const activeClientList = useMemo(
    () => clientList.filter(client => client.isActive),
    [clientList],
  );

  // Get notes for the selected client
  const currentClientNotes = useMemo(() => {
    if (!selectedClientId) return [];
    return clientNotes[selectedClientId] || [];
  }, [clientNotes, selectedClientId]);

  // Categorize notes by status
  const { scheduledNotes, draftNotes, publishedNotes } = useMemo(() => {
    const scheduled = currentClientNotes.filter(
      note => note.status === "scheduled",
    );
    const drafts = currentClientNotes.filter(
      note => note.status === "draft" || !note.status,
    );
    const published = currentClientNotes.filter(
      note => note.status === "published",
    );

    return {
      scheduledNotes: scheduled,
      draftNotes: drafts,
      publishedNotes: published,
    };
  }, [currentClientNotes]);

  // Counters for tabs
  const counters = useMemo(
    () => ({
      scheduledCount: scheduledNotes.length,
      draftCount: draftNotes.length,
      publishedCount: publishedNotes.length,
    }),
    [scheduledNotes.length, draftNotes.length, publishedNotes.length],
  );

  // Fetch notes for a specific client
  const fetchClientNotes = useCallback(async (clientId: string) => {
    if (!clientId) return;

    try {
      dispatch(setClientNotesLoading(true));
      dispatch(setClientNotesError(null));
      const response = await axiosInstance.get(
        `/api/ghost-writer/client/notes?clientId=${clientId}`,
      );

      dispatch(setClientNotes({ clientId, notes: response.data }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch notes";
      dispatch(setClientNotesError(errorMessage));
      Logger.error("Error fetching client notes:", {
        error: String(error),
        clientId,
      });
    } finally {
      dispatch(setClientNotesLoading(false));
    }
  }, []);

  // Fetch schedules for a specific client
  const fetchClientSchedules = useCallback(
    async (clientId: string) => {
      if (!clientId) return;
      if (clientSchedulesLoading) return;

      try {
        dispatch(setClientSchedulesLoading(true));

        const response = await axiosInstance.get(
          `/api/ghost-writer/client/queue?clientId=${clientId}`,
        );

        dispatch(setClientSchedules({ clientId, schedules: response.data }));
      } catch (error: any) {
        Logger.error("Error fetching client schedules:", {
          error: String(error),
          clientId,
        });
        dispatch(setClientSchedulesError(error.message));
      } finally {
        dispatch(setClientSchedulesLoading(false));
      }
    },
    [clientSchedulesLoading, clientSchedules],
  );

  // Set selected client and fetch their notes and schedules
  const selectClient = useCallback(
    (clientUserId: string | null) => {
      dispatch(setSelectedClientId(clientUserId));
      if (clientUserId) {
        setLastSelectedClientId(clientUserId);
        fetchClientNotes(clientUserId);
        fetchClientSchedules(clientUserId);
      }
    },
    [fetchClientNotes, fetchClientSchedules],
  );

  const selectLastClient = useCallback(() => {
    if (lastSelectedClientId) {
      if (selectedClientId === lastSelectedClientId) {
        return;
      }
      const client = activeClientList.find(
        client => client.accountUserId === lastSelectedClientId,
      );
      if (client) {
        selectClient(client.accountUserId);
        return;
      }
    }
    if (activeClientList && activeClientList.length > 0) {
      selectClient(activeClientList[0].accountUserId);
    }
  }, [lastSelectedClientId, selectClient, activeClientList]);

  // Select a note
  const selectNote = useCallback(
    (note: Note | NoteDraft | string | null) => {
      
      EventTracker.track("ghostwriter_notes_select_note");
      let noteToUpdate: NoteDraft | Note | null = null;

      if (typeof note === "string") {
        noteToUpdate =
          currentClientNotes.find(userNote => userNote.id === note) || null;
      } else {
        noteToUpdate = note;
      }

      let noteDraft = isNoteDraft(noteToUpdate);
      if (!noteDraft) {
        noteDraft = inspirationNoteToNoteDraft(noteToUpdate as Note);
      }

      dispatch(setSelectedClientNote(noteDraft));
    },
    [currentClientNotes],
  );

  // Create a new draft note for the selected client
  const createDraftNote = useCallback(
    async (draft?: Partial<NoteDraft>): Promise<void> => {
      if (!selectedClientId) {
        throw new Error("No client selected");
      }

      EventTracker.track("ghostwriter_notes_create_draft_note");

      try {
        setLoadingCreateNote(true);
        const response = await createNoteDraft(
          {
            body: draft?.body || "",
            status: draft?.status as NoteStatus,
            bodyJson: draft?.bodyJson || undefined,
            clientId: selectedClientId,
          },
          {},
        );

        dispatch(addClientNote({ clientId: selectedClientId, note: response }));
        dispatch(setSelectedClientNote(response));
      } catch (error: any) {
        Logger.error("Error creating ghostwriter draft note:", error);
        throw error;
      } finally {
        setLoadingCreateNote(false);
      }
    },
    [selectedClientId],
  );

  // Update note status
  const updateNoteStatus = useCallback(
    async (
      noteId: string,
      status: NoteStatus | "archived",
      scheduledTo?: Date,
    ) => {
      
      if (!selectedClientId) return;

      EventTracker.track("ghostwriter_notes_update_note_status_" + status);
      const previousNote = currentClientNotes.find(note => note.id === noteId);
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

        if (scheduledTo) {
          body.scheduledTo = scheduledTo;
        }

        await axiosInstance.patch<NoteDraft[]>(`/api/note/${noteId}`, body);

        if (status === "archived") {
          dispatch(removeClientNote({ clientId: selectedClientId, noteId }));
          if (selectedClientNote?.id === noteId) {
            dispatch(setSelectedClientNote(null));
          }
        } else {
          dispatch(
            updateClientNote({
              clientId: selectedClientId,
              noteId,
              note: { ...body },
            }),
          );
        }
      } catch (error: any) {
        Logger.error("Error updating status:", error);
        if (status === "archived") {
          dispatch(
            addClientNote({ clientId: selectedClientId, note: previousNote }),
          );
        } else {
          dispatch(
            updateClientNote({
              clientId: selectedClientId,
              noteId,
              note: { status: previousStatus },
            }),
          );
        }
        throw error;
      }
    },
    [selectedClientId, currentClientNotes, selectedClientNote],
  );

  // Update note feedback
  const updateNoteFeedback = useCallback(
    async (noteId: string, feedback: NoteFeedback, feedbackReason?: string) => {
      if (!selectedClientId) return;

      EventTracker.track("ghostwriter_notes_update_note_feedback", {
        feedback,
        feedbackReason,
      });

      let newFeedback: NoteFeedback | undefined = feedback;
      const note = currentClientNotes.find(note => note.id === noteId);
      if (!note) return;

      let previousFeedback = note?.feedback;
      if (previousFeedback === feedback) {
        newFeedback = undefined;
      }

      dispatch(
        updateClientNote({
          clientId: selectedClientId,
          noteId,
          note: { feedback: newFeedback },
        }),
      );

      try {
        await axiosInstance.patch<NoteDraft[]>(`/api/note/${noteId}`, {
          ...note,
          feedback: newFeedback || null,
          feedbackComment: feedbackReason || null,
          status: note.status || null,
        });
      } catch (error: any) {
        dispatch(
          updateClientNote({
            clientId: selectedClientId,
            noteId,
            note: { feedback: previousFeedback },
          }),
        );
        Logger.error("Error updating feedback:", error);
        throw error;
      }
    },
    [selectedClientId, currentClientNotes],
  );

  // Edit note body
  const editNoteBody = useCallback(
    async (
      noteId: string | null,
      body: string,
      json?: JSONContent,
    ): Promise<NoteDraft | null> => {
      if (!selectedClientId || !noteId) return null;

      const canUpdate = selectedClientNote?.id === noteId;
      if (!canUpdate) {
        return null;
      }

      EventTracker.track("ghostwriter_notes_edit_note_body");
      setLoadingEditNote(true);

      try {
        const bodyJson = json ? JSON.stringify(json) : undefined;
        const isEmpty = isEmptyNote(selectedClientNote);
        if (isEmpty) {
          // Create new note
          const data = await createNoteDraft({
            body,
            bodyJson,
            status: "draft",
            clientId: selectedClientId,
          });

          dispatch(addClientNote({ clientId: selectedClientId, note: data }));
          dispatch(setSelectedClientNote(data));
          return data;
        } else {
          // Update existing note
          const partialNote: Partial<NoteDraftBody> = {
            body,
            bodyJson,
            clientId: selectedClientId,
          };
          await updateNoteDraft(noteId, partialNote, {});

          dispatch(
            updateClientNote({
              clientId: selectedClientId,
              noteId,
              note: { body, bodyJson },
            }),
          );

          const note = currentClientNotes.find(note => note.id === noteId);
          return note ? { ...note, body } : null;
        }
      } catch (error: any) {
        Logger.error("Error editing note body:", error);
        throw error;
      } finally {
        setLoadingEditNote(false);
      }
    },
    [selectedClientId, selectedClientNote, currentClientNotes],
  );

  // Debounced update
  const updateNoteBodyDebounced = useCallback(
    debounce((noteId, body, json) => {
      editNoteBody(noteId, body, json);
    }, 200),
    [editNoteBody],
  );

  // Update note body
  const updateNoteBody = useCallback(
    (
      noteId: string | null,
      body: string,
      json?: JSONContent,
      options?: { immediate?: boolean },
    ) => {
      if (options?.immediate) {
        editNoteBody(noteId, body, json);
      } else {
        updateNoteBodyDebounced(noteId, body, json);
      }
    },
    [editNoteBody, updateNoteBodyDebounced],
  );

  // Improve text with AI
  const improveText = useCallback(
    async (
      text: string,
      type: ImprovementType,
      noteId: string | null,
      model?: string,
    ): Promise<{ text: string } | null> => {
      if (!selectedClientId || !noteId) return null;

      EventTracker.track("ghostwriter_idea_improve_text_" + type, {
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
          ghostwriterUserId: user?.userId, // Add ghostwriter ID
        },
      );

      const { responseBody } = res.data;
      if (!responseBody) {
        throw new Error("No text improved");
      }

      const { body, creditsUsed } = responseBody;
      dispatch(decrementUsage({ amount: creditsUsed }));

      if (noteId) {
        dispatch(
          updateClientNote({
            clientId: selectedClientId,
            noteId,
            note: { body },
          }),
        );
      }

      try {
        editNoteBody(noteId, body);
      } catch (error: any) {
        if (error instanceof CancelError) {
          return null;
        }
        throw error;
      }

      return body ? { text: body } : null;
    },
    [selectedClientId, dispatch, user?.userId],
  );

  // Generate new notes for client
  const generateNewNotes = useCallback(
    async (
      model?: string,
      options?: {
        useTopTypes?: boolean;
        topic?: string;
        preSelectedPostIds?: string[];
        includeArticleLinks?: boolean;
      },
    ) => {
      if (!selectedClientId) {
        throw new Error("No client selected");
      }

      try {
        setLoadingNotesGenerate(true);
        setErrorGenerateNotes(null);

        const validOptions = {
          ...options,
          useTopTypes: hasAdvancedGPT ? options?.useTopTypes : false,
          model: hasAdvancedGPT ? model : undefined,
          preSelectedPostIds: options?.preSelectedPostIds || [],
          includeArticleLinks: options?.includeArticleLinks || false,
          ghostwriterUserId: user?.userId, // Add ghostwriter ID
          clientId: selectedClientId, // Add client ID
        };

        EventTracker.track("ghostwriter_notes_generate_new_notes", { model });
        const response = await axiosInstance.post<AIUsageResponse<NoteDraft[]>>(
          "/api/notes/generate",
          validOptions,
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

        // Add generated notes to client notes
        body.forEach(note => {
          dispatch(addClientNote({ clientId: selectedClientId, note }));
        });
      } catch (error) {
        if (error instanceof AxiosError) {
          const code = error.response?.status;
          if (code === 429) {
            setErrorGenerateNotes(
              "Seems like the model you chose is not available right now. Try a different one.",
            );
          } else if (code === 402) {
            setErrorGenerateNotes("You ran out of credits.");
            throw new Error("Not enough credits");
          }
        }
        Logger.error("Error generating ghostwriter notes:", {
          error: String(error),
        });
        throw new Error("Something went wrong, no credits were used");
      } finally {
        setLoadingNotesGenerate(false);
      }
    },
    [selectedClientId, hasAdvancedGPT, user?.userId, consumeCredits],
  );

  // Get single note by ID
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

  // Schedule note (DB only, no actual sending)
  const scheduleNote = useCallback(
    async (
      note: NoteDraft,
      scheduledTo: Date,
      options?: {
        considerSeconds?: boolean;
        showToast?: boolean;
      },
    ) => {
      if (!selectedClientId) {
        throw new Error("No client selected");
      }

      try {
        setLoadingScheduleNote(true);
        Logger.info("GHOSTWRITER-SCHEDULE: scheduleNote", {
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

        // Create schedule with ghostwriter ID
        await axiosInstance.post(`/api/user/notes/${note.id}/schedule`, {
          date: validScheduledTo,
        });

        Logger.info("GHOSTWRITER-SCHEDULE: created schedule");
        await updateNoteStatus(note.id, "scheduled", scheduledTo);
        dispatch(
          updateClientNote({
            clientId: selectedClientId,
            noteId: note.id,
            note: { status: "scheduled", scheduledTo },
          }),
        );
        Logger.info("GHOSTWRITER-SCHEDULE: updated note status", { note });
      } catch (error: any) {
        Logger.error("Error scheduling ghostwriter note:", error);
        throw error;
      } finally {
        setLoadingScheduleNote(false);
      }
    },
    [selectedClientId, user?.userId, updateNoteStatus],
  );

  // Reschedule note
  const rescheduleNote = useCallback(
    async (
      noteId: string,
      newTime: Date,
      options?: { showToast?: boolean },
    ) => {
      if (!selectedClientId) return;

      const note = currentClientNotes.find(note => note.id === noteId);
      try {
        if (!note) {
          throw new Error("Note not found");
        }
        await scheduleNote(note, newTime, {
          showToast: options?.showToast,
        });
      } catch (error: any) {
        Logger.error(
          `Error rescheduling ghostwriter note: ${noteId}, ${error}, ${newTime}`,
          { error: String(error) },
        );
        throw error;
      }
    },
    [selectedClientId, currentClientNotes, scheduleNote],
  );

  // Delete schedule
  const deleteSchedule = useCallback(
    async (noteId: string, options?: { throwIfNotFound?: boolean }) => {
      try {
        await axiosInstance.delete(`/api/user/notes/${noteId}/schedule`, {
          params: { ghostwriterUserId: user?.userId },
        });
      } catch (error: any) {
        if (options?.throwIfNotFound) {
          throw error;
        }
        Logger.error("Error deleting ghostwriter schedule:", error);
      }
    },
    [user?.userId],
  );

  // Cancel update note body
  const cancelUpdateNoteBody = (noteId: NoteId, shouldCancel = true) => {
    if (shouldCancel) {
      cancelUpdateBody.current = [...cancelUpdateBody.current, noteId];
    } else {
      cancelUpdateBody.current = cancelUpdateBody.current.filter(
        id => id !== noteId,
      );
    }
  };

  // Upload file attachments
  const uploadFile = async (
    files: File[],
    noteId: string,
  ): Promise<NoteDraftImage[]> => {
    if (!selectedClientId) {
      throw new Error("No client selected");
    }

    if (uploadingFilesCount >= MAX_ATTACHMENTS) {
      throw new Error(`Only ${MAX_ATTACHMENTS} images allowed`);
    }

    let filesUploading = 0;

    try {
      const existingNote = currentClientNotes.find(note => note.id === noteId);
      const currentAttachments = existingNote?.attachments || [];

      if (currentAttachments.length >= MAX_ATTACHMENTS) {
        throw new Error(`Only ${MAX_ATTACHMENTS} images allowed`);
      }

      const maxAllowedAttachments = MAX_ATTACHMENTS - currentAttachments.length;
      const attachmentsToUpload = files.slice(0, maxAllowedAttachments);
      filesUploading = attachmentsToUpload.length;
      setUploadingFilesCount(filesUploading);
      const uploadedFiles: NoteDraftImage[] = [];

      for (const file of attachmentsToUpload) {
        try {
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          const fileId = crypto.randomUUID();

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
            formData.append("ghostwriterUserId", user?.userId || "");

            const response = await axiosInstance.post<NoteDraftImage>(
              `/api/note/${noteId}/image`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              },
            );

            if (chunkIndex === totalChunks - 1 && response.data) {
              if (noteId) {
                dispatch(
                  updateClientNote({
                    clientId: selectedClientId,
                    noteId,
                    note: {
                      attachments: [...currentAttachments, response.data],
                    },
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

  // Delete image attachment
  const deleteImage = useCallback(
    async (noteId: string, attachment: NoteDraftImage) => {
      if (!selectedClientId) return;

      try {
        const existingNote = currentClientNotes.find(
          note => note.id === noteId,
        );
        const updatedAttachments =
          existingNote?.attachments?.filter(att => att.id !== attachment.id) ||
          [];

        dispatch(
          updateClientNote({
            clientId: selectedClientId,
            noteId,
            note: { attachments: updatedAttachments },
          }),
        );

        await axiosInstance.delete(
          `/api/note/${noteId}/image/${attachment.id}`,
          {
            params: { ghostwriterUserId: user?.userId },
          },
        );
      } catch (error) {
        // Revert on error
        const existingNote = currentClientNotes.find(
          note => note.id === noteId,
        );
        const revertedAttachments = [
          ...(existingNote?.attachments || []),
          attachment,
        ];
        dispatch(
          updateClientNote({
            clientId: selectedClientId,
            noteId,
            note: { attachments: revertedAttachments },
          }),
        );
        Logger.error("Error deleting image:", { error: String(error) });
        throw error;
      }
    },
    [selectedClientId, currentClientNotes, user?.userId],
  );

  // Get OG data for links
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

  // Upload link as attachment
  const uploadLink = async (
    noteId: string,
    url: string,
  ): Promise<NoteDraftImage & { og: OpenGraphResponse }> => {
    const formData = new FormData();
    formData.append("url", url);
    formData.append("type", AttachmentType.link);
    formData.append("ghostwriterUserId", user?.userId || "");

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

  // Fetch notes for specific date (analytics)
  const fetchNotesForDate = useCallback(
    async (date: string): Promise<NoteWithEngagementStats[]> => {
      if (!selectedClientId) return [];

      try {
        const response = await axiosInstance.get<NoteWithEngagementStats[]>(
          `/api/user/notes/stats/engagement/${date}`,
          {
            params: {
              ghostwriterUserId: user?.userId,
              clientId: selectedClientId,
            },
          },
        );
        return response.data;
      } catch (error) {
        Logger.error("Error fetching ghostwriter notes for date:", {
          error: String(error),
          date,
        });
        throw error;
      }
    },
    [selectedClientId, user?.userId],
  );

  const activeClient = useMemo(() => {
    return activeClientList.find(
      client => client.accountUserId === selectedClientId,
    );
  }, [activeClientList, selectedClientId]);

  // Get schedules for the selected client
  const currentClientSchedules = useMemo(() => {
    return clientSchedules || [];
  }, [clientSchedules]);

  // Add schedule for selected client
  const addSchedule = useCallback(
    async (schedule: CreateUserSchedule) => {
      if (!selectedClientId) {
        throw new Error("No client selected");
      }

      const schedules = currentClientSchedules;

      // check if schedule is already in the queue
      const isAlreadyInQueue = schedules.some(
        (s: UserSchedule) =>
          s.hour === schedule.hour &&
          s.minute === schedule.minute &&
          s.ampm === schedule.ampm,
      );
      if (isAlreadyInQueue) {
        throw new ScheduleExistsError("Schedule already exists in the queue");
      }

      if (loadingAddSchedule) {
        return;
      }

      setLoadingAddSchedule(true);

      try {
        const response = await axiosInstance.post("/api/user/queue", {
          ...schedule,
          clientId: selectedClientId,
        });
        dispatch(addClientSchedule(response.data));
      } catch (error) {
        Logger.error("Error adding client schedule:", { error: String(error) });
        throw error;
      } finally {
        setLoadingAddSchedule(false);
      }
    },
    [selectedClientId, currentClientSchedules],
  );

  // Remove schedule for selected client
  const removeSchedule = useCallback(
    async (id: string) => {
      if (!selectedClientId) {
        throw new Error("No client selected");
      }

      const schedules = currentClientSchedules;
      const previousSchedule = schedules.find((s: UserSchedule) => s.id === id);
      if (!previousSchedule) {
        return;
      }
      try {
        dispatch(removeClientSchedule(id));
        await axiosInstance.delete(`/api/user/queue/${id}`);
      } catch (error) {
        dispatch(addClientSchedule(previousSchedule));
        Logger.error("Error removing client schedule:", {
          error: String(error),
        });
        throw error;
      }
    },
    [selectedClientId, currentClientSchedules],
  );

  // Update schedule for selected client
  const updateSchedule = useCallback(
    async (schedule: UserSchedule, day: string | null) => {
      if (!selectedClientId) {
        throw new Error("No client selected");
      }

      if (loadingScheduleDay === day) {
        return;
      }

      setLoadingScheduleDay(day);
      setLoadingSchedule(true);

      const schedules = currentClientSchedules;
      const previousSchedule = schedules.find(
        (s: UserSchedule) => s.id === schedule.id,
      );
      if (!previousSchedule) {
        return;
      }

      // optimistic update
      dispatch(updateClientSchedule({ ...previousSchedule, ...schedule }));

      try {
        await axiosInstance.patch(`/api/user/queue/${schedule.id}`, schedule);
        dispatch(updateClientSchedule(schedule));
      } catch (error) {
        // revert optimistic update
        dispatch(updateClientSchedule(previousSchedule));
        Logger.error("Error updating client schedule:", {
          error: String(error),
        });
        throw error;
      } finally {
        setLoadingScheduleDay(null);
        setLoadingSchedule(false);
      }
    },
    [selectedClientId, currentClientSchedules],
  );

  return {
    // State
    clientNotes: currentClientNotes,
    selectedClientId,
    selectedClientNote,
    clientNotesLoading,
    clientNotesError,
    clientSchedules: currentClientSchedules,
    clientSchedulesLoading,
    activeClientList,
    activeClient,

    // Categorized notes
    scheduledNotes,
    draftNotes,
    publishedNotes,
    counters,

    // Actions
    selectClient,
    selectLastClient,
    selectNote,
    fetchClientNotes,
    fetchClientSchedules,
    addSchedule,
    removeSchedule,
    updateSchedule,
    createDraftNote,
    updateNoteStatus,
    updateNoteFeedback,
    updateNoteBody,
    editNoteBody,
    improveText,
    generateNewNotes,
    getNoteByNoteId,
    scheduleNote,
    rescheduleNote,
    deleteSchedule,
    cancelUpdateNoteBody,
    uploadFile,
    deleteImage,
    getOgData,
    uploadLink,
    fetchNotesForDate,

    // Loading states
    loadingEditNote,
    loadingCreateNote,
    isLoadingGenerateNotes: loadingNotesGenerate,
    errorGenerateNotes,
    uploadingFilesCount,
    loadingScheduleNote,
    loadingAddSchedule,
    loadingScheduleDay,
    loadingSchedule,
  };
};

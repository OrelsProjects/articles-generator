import { useCallback, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { selectNotes, updateNote } from "@/lib/features/notes/notesSlice";
import { NoteDraft } from "@/types/note";
import axios from "axios";
import { Logger } from "@/logger";
import { useExtension } from "@/lib/hooks/useExtension";
import { ScheduleFailedEmptyNoteBodyError } from "@/types/errors/ScheduleFailedEmptyNoteBodyError";
import { extensionApiRequest } from "@/lib/api/api";
import { ScheduleLimitExceededError } from "@/types/errors/ScheduleLimitExceededError";

export const useNotesSchedule = () => {
  const dispatch = useAppDispatch();
  const { userNotes, loadingNotes, error } = useAppSelector(selectNotes);
  const { setUserSubstackCookies, sendExtensionApiRequest } = useExtension();

  const [loadingScheduleNote, setLoadingScheduleNote] = useState(false);
  const [isIntervalRunning, setIsIntervalRunning] = useState(false);
  const checkScheduleInterval = useRef<NodeJS.Timeout | null>(null);

  const canSchedule = async (options: { setCookiesIfVerified: boolean }) => {
    try {
      const canScheduleResponse = await axios.get("/api/user/schedule");
      const { canSchedule } = canScheduleResponse.data;
      if (options.setCookiesIfVerified && canSchedule) {
        await setUserSubstackCookies();
      }
      return canSchedule;
    } catch (error) {
      return false;
    }
  };

  const cancelCanUserScheduleInterval = () => {
    if (checkScheduleInterval.current) {
      clearInterval(checkScheduleInterval.current);
    }
    setIsIntervalRunning(false);
  };

  const initCanUserScheduleInterval = () => {
    if (isIntervalRunning) return;
    setIsIntervalRunning(true);
    const maxTries = 15;
    let tries = 0;
    return new Promise((resolve, reject) => {
      checkScheduleInterval.current = setInterval(async () => {
        const canUserSchedule = await canSchedule({
          setCookiesIfVerified: true,
        });
        if (canUserSchedule) {
          resolve(canUserSchedule);
          if (checkScheduleInterval.current) {
            clearInterval(checkScheduleInterval.current);
          }
          setIsIntervalRunning(false);
        }
        tries++;
        if (tries >= maxTries) {
          reject(new Error("Failed to check if user can schedule"));
          setIsIntervalRunning(false);
        }
      }, 3000);
    });
  };

  const scheduleNote = useCallback(
    async (note: NoteDraft) => {
      if (!note.body || note.body.length === 0) {
        throw new ScheduleFailedEmptyNoteBodyError("Note body is empty");
      }
      setLoadingScheduleNote(true);

      const previousNote = userNotes.find(n => n.id === note.id);

      try {
        if (!note.scheduledTo) {
          throw new ScheduleFailedEmptyNoteBodyError(
            "Note scheduledTo is empty",
          );
        }
        // Then update on server
        await sendExtensionApiRequest("schedule", {
          date: note.scheduledTo,
          noteId: note.id,
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
        // if error is 429, show a toast
        if (error.response.status === 429) {
          throw new ScheduleLimitExceededError(
            "You have reached the maximum number of scheduled notes",
          );
        }
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
        setLoadingScheduleNote(false);
      }
    },
    [dispatch],
  );

  const scheduleNoteById = useCallback(
    async (noteId: string, scheduledTo: Date) => {
      const note = userNotes.find(n => n.id === noteId);
      if (!note) return;
      dispatch(
        updateNote({
          id: noteId,
          note: {
            scheduledTo,
          },
        }),
      );
      try {
        await scheduleNote({
          ...note,
          scheduledTo,
        });
      } catch (error) {
        dispatch(
          updateNote({
            id: noteId,
            note: { scheduledTo: note.scheduledTo },
          }),
        );
        throw error;
      }
    },
    [scheduleNote],
  );
  return {
    notes: userNotes,
    loading: loadingNotes,
    error,
    scheduleNote,
    loadingScheduleNote,
    initCanUserScheduleInterval,
    isIntervalRunning,
    cancelCanUserScheduleInterval,
    scheduleNoteById,
  };
};

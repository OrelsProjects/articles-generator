import { useCallback, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { selectNotes, updateNote } from "@/lib/features/notes/notesSlice";
import { isEmptyNote, NoteDraft } from "@/types/note";
import axios from "axios";
import { Logger } from "@/logger";
import { NoSubstackCookiesError } from "@/types/errors/NoSubstackCookiesError";
import { useExtension } from "@/lib/hooks/useExtension";

export const useNotesSchedule = () => {
  const dispatch = useAppDispatch();
  const { userNotes, loadingNotes, error } = useAppSelector(selectNotes);
  const { setUserSubstackCookies } = useExtension();

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
      setLoadingScheduleNote(true);

      const previousNote = userNotes.find(n => n.id === note.id);

      try {
        const canUserSchedule = await canSchedule({
          setCookiesIfVerified: false,
        });

        if (!canUserSchedule) {
          throw new NoSubstackCookiesError("User cannot schedule notes");
        }

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
        setLoadingScheduleNote(false);
      }
    },
    [dispatch],
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
  };
};

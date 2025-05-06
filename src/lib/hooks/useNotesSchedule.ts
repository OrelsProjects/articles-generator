import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { selectNotes, updateNote } from "@/lib/features/notes/notesSlice";
import { NoteDraft } from "@/types/note";
import axios from "axios";
import { Logger } from "@/logger";
import { useExtension } from "@/lib/hooks/useExtension";
import { ScheduleFailedEmptyNoteBodyError } from "@/types/errors/ScheduleFailedEmptyNoteBodyError";
import { ScheduleLimitExceededError } from "@/types/errors/ScheduleLimitExceededError";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { GetSchedulesResponse, Schedule } from "@/types/useExtension.type";
import { ScheduleNotFoundError } from "@/types/errors/ScheduleNotFoundError";
import { ScheduleInPastError } from "@/types/errors/ScheduleInPastError";
import { toast } from "react-toastify";
import { humanMessage } from "@/lib/utils/human-message";
import {
  getInvalidTimeMessage,
  isValidScheduleTime,
} from "@/lib/utils/date/schedule";

export const useNotesSchedule = () => {
  const { user } = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const { userNotes, loadingNotes, error } = useAppSelector(selectNotes);
  const {
    createSchedule,
    getSchedules,
    deleteSchedule: deleteScheduleExtension,
    hasExtension,
  } = useExtension();

  const [loadingScheduleNote, setLoadingScheduleNote] = useState(false);
  const [isIntervalRunning, setIsIntervalRunning] = useState(false);
  const checkScheduleInterval = useRef<NodeJS.Timeout | null>(null);
  const loadingGetSchedules = useRef(false);

  const canSchedule = async (options: { setCookiesIfVerified: boolean }) => {
    try {
      return true;
      // const canScheduleResponse = await axios.get("/api/user/schedule");
      // const { canSchedule } = canScheduleResponse.data;
      // if (options.setCookiesIfVerified && canSchedule) {
      //   await setUserSubstackCookies();
      // }
      // return canSchedule;
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

  const deleteSchedule = useCallback(
    async (
      noteId: string,
      options: { throwIfNotFound: boolean } = {
        throwIfNotFound: true,
      },
    ) => {
      try {
        const scheduleResponse = await axios.get(
          `/api/user/notes/${noteId}/schedule`,
        );
        const schedule = scheduleResponse.data;
        if (!schedule) {
          if (options.throwIfNotFound) {
            throw new ScheduleNotFoundError("Schedule not found");
          }
          return;
        }
        await deleteScheduleExtension(schedule.id);
        await axios.delete(`/api/v1/schedule/${schedule.id}`);
      } catch (error: any) {
        Logger.error("Error deleting schedule", { error });
        throw error;
      }
    },
    [],
  );

  /**
   * @throws Error
   * @throws NoExtensionError
   * @throws ScheduleInPastError
   * @throws ScheduleLimitExceededError
   * @throws ScheduleFailedEmptyNoteBodyError
   */
  const scheduleNote = useCallback(
    async (note: NoteDraft, options?: { showToast?: boolean }) => {
      if (!user) {
        throw new Error("User not found");
      }
      if (!note.body || note.body.length === 0) {
        const error = new ScheduleFailedEmptyNoteBodyError(
          "Note body is empty",
        );
        throw error;
      }

      await hasExtension({
        throwIfNoExtension: true,
        showDialog: true,
      });

      setLoadingScheduleNote(true);
      Logger.info("ADDING-SCHEDULE: scheduleNote", {
        note,
        userNotes,
        user,
      });
      const previousNote = userNotes.find(n => n.id === note.id);

      try {
        if (!note.scheduledTo) {
          const error = new ScheduleFailedEmptyNoteBodyError(
            "Note scheduledTo is empty",
          );
          throw error;
        }

        if (!isValidScheduleTime(note.scheduledTo)) {
          throw new Error(getInvalidTimeMessage());
        }

        await hasExtension({
          throwIfNoExtension: true,
          showDialog: true,
        });

        Logger.info("ADDING-SCHEDULE: scheduleNote: hasExtension passed");
        const existingSchedule = await axios.get(
          `/api/user/notes/${note.id}/schedule`,
        );
        if (existingSchedule.data) {
          Logger.info("ADDING-SCHEDULE: scheduleNote: existingSchedule found", {
            existingSchedule,
          });
          const deletedScheduleId = existingSchedule.data.id;
          await axios.delete(`/api/user/notes/${note.id}/schedule`);
          await deleteScheduleExtension(deletedScheduleId);
          Logger.info(
            "ADDING-SCHEDULE: scheduleNote: deleted existing schedule",
            {
              deletedScheduleId,
            },
          );
        }
        const newScheduleResponse = await axios.post("/api/v1/schedule", {
          noteId: note.id,
          scheduledTo: note.scheduledTo,
        });
        Logger.info("ADDING-SCHEDULE: scheduleNote: newScheduleResponse", {
          newScheduleResponse,
        });
        const newSchedule = newScheduleResponse.data.schedule;
        Logger.info("ADDING-SCHEDULE: scheduleNote: newSchedule", {
          newSchedule,
        });
        // Then update on extension
        await createSchedule({
          scheduleId: newSchedule.id,
          userId: user.userId,
          noteId: note.id,
          timestamp: note.scheduledTo.getTime(),
        });
        Logger.info("ADDING-SCHEDULE: scheduleNote: created new schedule", {
          newSchedule,
        });
      } catch (error: any) {
        Logger.error("ADDING-SCHEDULE: scheduleNote: error", {
          error,
        });
        Logger.error("Error updating note date:", error);
        if (options?.showToast) {
          // if axioserror, get the response error
          const fallback =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message;
          toast.error(humanMessage(error, fallback));
        }
        // if error is 429, show a toast
        if (error.response?.status === 429) {
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
    [],
  );

  const getSchedulesFromExtension =
    useCallback(async (): Promise<GetSchedulesResponse> => {
      try {
        if (loadingGetSchedules.current) throw new Error("Loading schedules");
        loadingGetSchedules.current = true;
        const schedules = await getSchedules();
        return schedules;
      } catch (error) {
        Logger.error("Error getting schedules", { error });
        loadingGetSchedules.current = false;
        throw error;
      } finally {
        loadingGetSchedules.current = false;
      }
    }, []);

  return {
    notes: userNotes,
    loading: loadingNotes,
    error,
    loadingScheduleNote,
    initCanUserScheduleInterval,
    isIntervalRunning,
    cancelCanUserScheduleInterval,
    scheduleNote,
    getSchedulesFromExtension,
    deleteSchedule,
  };
};

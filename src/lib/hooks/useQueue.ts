import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  setUserSchedule,
  addUserSchedule,
  removeUserSchedule,
  updateUserSchedule,
  updateNote,
} from "@/lib/features/notes/notesSlice";
import { CreateUserSchedule, UserSchedule } from "@/types/schedule";
import axios from "axios";
import { ScheduleExistsError } from "@/lib/errors/ScheduleExistsError";
import { HourlyStats } from "@/types/notes-status";
import { setBestTimeToPublish } from "@/lib/features/statistics/statisticsSlice";

export function useQueue() {
  const dispatch = useAppDispatch();
  const { userNotes, userSchedules } = useAppSelector(state => state.notes);
  const { bestTimeToPublish } = useAppSelector(state => state.statistics);
  const [loading, setLoading] = useState(false);
  const [loadingBestTimeToPublish, setLoadingBestTimeToPublish] =
    useState(false);

  const loadingBestNotesRef = useRef(false);

  const scheduledNotes = useMemo(() => {
    return userNotes.filter(
      note => note.status === "scheduled" && note.scheduledTo,
    );
  }, [userNotes]);

  // Those that are scheduled to after now
  const relevantScheduledNotes = useMemo(() => {
    return scheduledNotes.filter(
      note => note.scheduledTo && note.scheduledTo > new Date(),
    );
  }, [scheduledNotes]);

  const initQueue = async () => {
    try {
      const response = await axios.post<UserSchedule[]>("/api/user/queue/init");
      dispatch(setUserSchedule(response.data));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const addSchedule = async (schedule: CreateUserSchedule) => {
    // check if schedule is already in the queue
    const isAlreadyInQueue = userSchedules.some(
      s =>
        s.hour === schedule.hour &&
        s.minute === schedule.minute &&
        s.ampm === schedule.ampm,
    );
    if (isAlreadyInQueue) {
      throw new ScheduleExistsError("Schedule already exists in the queue");
    }
    setLoading(true);
    try {
      const response = await axios.post("/api/user/queue", schedule);
      dispatch(addUserSchedule(response.data));
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeSchedule = async (id: string) => {
    const previousSchedule = userSchedules.find(s => s.id === id);
    if (!previousSchedule) {
      return;
    }
    dispatch(removeUserSchedule(id));
    try {
      await axios.delete(`/api/user/queue/${id}`);
    } catch (error) {
      dispatch(updateUserSchedule(previousSchedule));
      console.error(error);
      throw error;
    }
  };

  const updateSchedule = async (schedule: UserSchedule) => {
    setLoading(true);
    const previousSchedule = userSchedules.find(s => s.id === schedule.id);
    if (!previousSchedule) {
      return;
    }
    // optimistic update
    dispatch(updateUserSchedule({ ...previousSchedule, ...schedule }));

    try {
      await axios.patch(`/api/user/queue/${schedule.id}`, schedule);
    } catch (error) {
      // revert optimistic update
      dispatch(updateUserSchedule(previousSchedule));
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await axios.get<UserSchedule[]>("/api/user/queue");
      dispatch(setUserSchedule(response.data));
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const rescheduleNote = async (noteId: string, newTime: Date) => {
    setLoading(true);
    const noteToUpdate = userNotes.find(note => note.id === noteId);

    if (!noteToUpdate) {
      setLoading(false);
      return;
    }

    // Optimistic update
    dispatch(
      updateNote({
        id: noteId,
        note: {
          scheduledTo: newTime,
        },
      }),
    );

    try {
      // Update the note on the server
      await axios.patch(`/api/user/notes/${noteId}`, {
        scheduledTo: newTime.toISOString(),
      });
    } catch (error) {
      // Revert optimistic update on error
      dispatch(
        updateNote({
          id: noteId,
          note: {
            scheduledTo: noteToUpdate.scheduledTo,
          },
        }),
      );
      console.error("Failed to reschedule note:", error);
    } finally {
      setLoading(false);
    }
  };

  // Returns the next available schedule in the queue that has no note scheduled to it
  // go over schedules and return the first one that has no note scheduled to it.
  // Doesn't have to be bigger than now
  const getNextAvailableSchedule = () => {
    // Start from today
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    // Look 30 days ahead maximum
    const maxDaysToLook = 30;
    let currentDay = new Date();

    // For each day, check if there's an available slot
    for (let dayOffset = 0; dayOffset < maxDaysToLook; dayOffset++) {
      if (dayOffset > 0) {
        // Set to next day at beginning of day
        currentDay = new Date(today);
        currentDay.setDate(today.getDate() + dayOffset);
        currentDay.setHours(0, 0, 0, 0);
      }

      // Get day of week for this day
      const dayOfWeek = currentDay
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      // Filter schedules for this day of week
      const daySchedules = userSchedules.filter(schedule => {
        return schedule[dayOfWeek as keyof UserSchedule];
      });

      // No schedules for this day, continue to next day
      if (daySchedules.length === 0) continue;

      // Sort schedules by time
      daySchedules.sort((a, b) => {
        // Convert to 24-hour format for easier comparison
        const getHour24 = (schedule: UserSchedule) => {
          let hour = schedule.hour;
          if (schedule.ampm === "pm" && hour < 12) hour += 12;
          if (schedule.ampm === "am" && hour === 12) hour = 0;
          return hour;
        };

        const aHour = getHour24(a);
        const bHour = getHour24(b);

        if (aHour !== bHour) return aHour - bHour;
        return a.minute - b.minute;
      });

      // For each schedule on this day, check if there's a note already scheduled
      for (const schedule of daySchedules) {
        // Convert schedule to 24-hour format for comparison
        let scheduleHour = schedule.hour;
        if (schedule.ampm === "pm" && scheduleHour < 12) scheduleHour += 12;
        if (schedule.ampm === "am" && scheduleHour === 12) scheduleHour = 0;

        // Skip schedules earlier than current time for today
        if (
          dayOffset === 0 &&
          (scheduleHour < currentHour ||
            (scheduleHour === currentHour && schedule.minute <= currentMinute))
        ) {
          continue;
        }

        // Create a date object for this schedule
        const scheduleDate = new Date(currentDay);
        scheduleDate.setHours(scheduleHour, schedule.minute, 0, 0);

        // Check if there's already a note scheduled at this exact time
        const hasScheduledNote = scheduledNotes.some(note => {
          if (!note.scheduledTo) return false;

          const noteDate = new Date(note.scheduledTo);
          return (
            noteDate.getFullYear() === scheduleDate.getFullYear() &&
            noteDate.getMonth() === scheduleDate.getMonth() &&
            noteDate.getDate() === scheduleDate.getDate() &&
            noteDate.getHours() === scheduleDate.getHours() &&
            noteDate.getMinutes() === scheduleDate.getMinutes()
          );
        });

        // If no note is scheduled for this slot, return it
        if (!hasScheduledNote) {
          console.log("scheduleDate", scheduleDate);
          return scheduleDate;
        }
      }
    }

    // If no available slot found, return null
    return null;
  };

  const fetchBestTimeToPublish = async () => {
    if (loadingBestNotesRef.current) {
      return;
    }
    loadingBestNotesRef.current = true;
    setLoadingBestTimeToPublish(true);
    try {
      const response = await axios.get<HourlyStats[]>(
        "/api/user/notes/stats/post-time",
      );
      dispatch(setBestTimeToPublish(response.data));
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoadingBestTimeToPublish(false);
      loadingBestNotesRef.current = false;
    }
  };

  useEffect(() => {
    if (userSchedules.length === 0) {
      fetchSchedules();
    }
    if (relevantScheduledNotes.length === 0) {
      fetchBestTimeToPublish();
    }
  }, []);

  return {
    scheduledNotes,
    relevantScheduledNotes,
    addSchedule,
    removeSchedule,
    updateSchedule,
    rescheduleNote,
    initQueue,
    loading,
    getNextAvailableSchedule,
    loadingBestTimeToPublish,
    bestTimeToPublish,
    fetchBestTimeToPublish,
  };
}

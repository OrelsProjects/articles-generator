import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { useEffect, useMemo, useState } from "react";
import {
  setUserSchedule,
  addUserSchedule,
  removeUserSchedule,
  updateUserSchedule,
} from "@/lib/features/notes/notesSlice";
import { CreateUserSchedule, UserSchedule } from "@/types/schedule";
import axios from "axios";
import { ScheduleExistsError } from "@/lib/errors/ScheduleExistsError";

export function useQueue() {
  const dispatch = useAppDispatch();
  const { userNotes, userSchedules } = useAppSelector(state => state.notes);

  const [loading, setLoading] = useState(false);

  const scheduledNotes = useMemo(() => {
    return userNotes.filter(note => note.scheduledTo);
  }, [userNotes]);

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
    try {
      const response = await axios.get<UserSchedule[]>("/api/user/queue");
      dispatch(setUserSchedule(response.data));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  useEffect(() => {
    if (userSchedules.length === 0) {
      fetchSchedules();
    }
  }, []);

  return {
    scheduledNotes,
    addSchedule,
    removeSchedule,
    updateSchedule,
    initQueue,
    loading,
  };
}

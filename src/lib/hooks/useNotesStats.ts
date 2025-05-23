import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "@/lib/axios-instance";
import {
  setStreak,
  selectStatistics,
  setTopEngagers,
  setNoteStats,
  setLoadingReactions,
  setReactionsInterval,
} from "@/lib/features/statistics/statisticsSlice";
import { Streak, NoteStats, ReactionInterval } from "@/types/notes-stats";
import { getStreakCount } from "@/lib/utils/streak";
import { Engager } from "@/types/engager";

export function useNotesStats() {
  const {
    streak,
    topEngagers,
    noteStats,
    loadingReactions,
    reactionsInterval,
  } = useSelector(selectStatistics);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorEngagers, setErrorEngagers] = useState<string | null>(null);
  const [errorReactions, setErrorReactions] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const loadingTopEngagersRef = useRef(false);
  const loadingReactionsRef = useRef(false);

  async function fetchStreakData() {
    if (streak.length > 0 || loading) {
      return;
    }
    try {
      setLoading(true);
      console.log("fetching streak data");
      // Only fetch if we don't already have data
      loadingRef.current = true;
      const response = await axiosInstance.get<Streak[]>(
        "/api/user/notes/stats/streak",
      );
      dispatch(setStreak(response.data));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      console.log("finished fetching streak data");
      loadingRef.current = false;
      setLoading(false);
    }
  }

  const fetchTopEngagers = async () => {
    if (topEngagers.length > 0 || loadingTopEngagersRef.current) {
      return;
    }
    try {
      loadingTopEngagersRef.current = true;
      const response = await axiosInstance.post<{ result: Engager[] }>(
        "/api/v1/top-engagers?limit=60&page=1",
      );
      dispatch(setTopEngagers(response.data.result));
    } catch (err) {
      setErrorEngagers(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      loadingTopEngagersRef.current = false;
    }
  };

  const fetchReactions = async (
    interval: ReactionInterval = reactionsInterval,
    forceRefresh = false,
  ) => {
    if (
      !forceRefresh &&
      noteStats &&
      interval === reactionsInterval
    ) {
      return;
    }

    if (loadingReactionsRef.current) {
      return;
    }

    try {
      loadingReactionsRef.current = true;
      dispatch(setLoadingReactions(true));
      const response = await axiosInstance.get<NoteStats>(
        `/api/user/notes/stats/reactions?interval=${interval}`,
      );
      dispatch(setNoteStats(response.data));
      dispatch(setReactionsInterval(interval));
      setErrorReactions(null);
    } catch (err) {
      setErrorReactions(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      loadingReactionsRef.current = false;
      dispatch(setLoadingReactions(false));
    }
  };

  const changeReactionsInterval = (interval: ReactionInterval) => {
    fetchReactions(interval, true);
  };

  useEffect(() => {
    fetchStreakData();
    fetchTopEngagers();
    fetchReactions();
  }, []);

  const streakCount = useMemo(() => getStreakCount(streak), [streak]);

  return {
    streak,
    streakCount,
    loading,
    error,
    topEngagers,
    errorEngagers,
    noteStats,
    loadingReactions,
    errorReactions,
    reactionsInterval,
    fetchReactions,
    changeReactionsInterval,
  };
}

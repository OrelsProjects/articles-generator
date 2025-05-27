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
  setFetchingStreak,
  setNotesForDate,
  setLoadingNotesForDate,
} from "@/lib/features/statistics/statisticsSlice";
import {
  Streak,
  NoteStats,
  ReactionInterval,
  IntervalStats,
  NoteWithEngagementStats,
} from "@/types/notes-stats";
import { getStreakCount } from "@/lib/utils/streak";
import { Engager } from "@/types/engager";

export function useNotesStats() {
  const {
    streak,
    topEngagers,
    noteStats,
    notesForDate,
    loadingReactions,
    loadingNotesForDate,
    reactionsInterval,
    fetchingStreak,
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
    if (fetchingStreak) {
      return;
    }
    if (streak.length > 0 || loading) {
      return;
    }
    try {
      setLoading(true);
      dispatch(setFetchingStreak(true));
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
      dispatch(setFetchingStreak(false));
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
    if (!forceRefresh && noteStats && interval === reactionsInterval) {
      return;
    }

    if (loadingReactionsRef.current) {
      return;
    }

    try {
      loadingReactionsRef.current = true;
      dispatch(setLoadingReactions(true));

      // Fetch both reactions and engagement stats in parallel
      const [reactionsResponse, engagementResponse] = await Promise.all([
        axiosInstance.get<NoteStats>(
          `/api/user/notes/stats/reactions?interval=${interval}`,
        ),
        axiosInstance.get<{
          stats: {
            clicks: IntervalStats[];
            follows: IntervalStats[];
            paidSubscriptions: IntervalStats[];
            freeSubscriptions: IntervalStats[];
            arr: IntervalStats[];
            shares: IntervalStats[];
          };
          totals: {
            follows: number;
            freeSubscriptions: number;
            paidSubscriptions: number;
          };
        }>(`/api/user/notes/stats/engagement?interval=${interval}`),
      ]);

      // Combine the data
      const combinedStats: NoteStats = {
        ...reactionsResponse.data,
        totalClicks: engagementResponse.data.stats.clicks,
        totalFollows: engagementResponse.data.stats.follows,
        totalPaidSubscriptions: engagementResponse.data.stats.paidSubscriptions,
        totalFreeSubscriptions: engagementResponse.data.stats.freeSubscriptions,
        totalArr: engagementResponse.data.stats.arr,
        totalShareClicks: engagementResponse.data.stats.shares,
        engagementTotals: engagementResponse.data.totals,
      };

      dispatch(setNoteStats(combinedStats));
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

  const fetchNotesForDate = async (date: string) => {
    try {
      dispatch(setLoadingNotesForDate(true));
      const response = await axiosInstance.get<NoteWithEngagementStats[]>(
        `/api/user/notes/stats/engagement/${date}`,
      );
      dispatch(setNotesForDate(response.data));
    } catch (err) {
      console.error("Error fetching notes for date:", err);
      dispatch(setNotesForDate([]));
    } finally {
      dispatch(setLoadingNotesForDate(false));
    }
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
    notesForDate,
    loadingReactions,
    loadingNotesForDate,
    errorReactions,
    reactionsInterval,
    fetchReactions,
    changeReactionsInterval,
    fetchNotesForDate,
  };
}

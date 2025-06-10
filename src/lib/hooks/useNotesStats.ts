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
import { Streak, NoteStats, ReactionInterval } from "@/types/notes-stats";
import { getStreakCount } from "@/lib/utils/streak";
import { Engager } from "@/types/engager";
import { useExtension } from "@/lib/hooks/useExtension";
import { Logger } from "@/logger";

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
  const {
    updateNotesStatistics,
    getNotesStatistics,
    getNotesWithStatsForDate,
  } = useExtension();
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
      const [reactionsResponse, engagementResponse] = await Promise.allSettled([
        axiosInstance.get<NoteStats>(
          `/api/user/notes/stats/reactions?interval=${interval}`,
        ),
        getNotesStatistics(interval),
      ]);

      let combinedStats: NoteStats | null = null;
      if (reactionsResponse.status === "fulfilled") {
        combinedStats = reactionsResponse.value.data;
      }
      if (engagementResponse.status === "fulfilled") {
        const engagementData = engagementResponse.value;
        if (!combinedStats) {
          combinedStats = engagementData;
        } else if (engagementData) {
          combinedStats = {
            ...combinedStats,
            totalClicks: engagementData.totalClicks || [],
            totalFollows: engagementData.totalFollows || [],
            totalPaidSubscriptions: engagementData.totalPaidSubscriptions || [],
            totalFreeSubscriptions: engagementData.totalFreeSubscriptions || [],
            totalArr: engagementData.totalArr || [],
            totalShareClicks: engagementData.totalShareClicks || [],
            engagementTotals: engagementData.engagementTotals,
          };
        }
      }

      if (!combinedStats) {
        setErrorReactions("Failed to fetch reactions or engagement stats");
        return;
      }

      Logger.info("Fetched reactions and engagement stats", {
        combinedStats,
        reactionsResponse,
        engagementResponse,
      });

      dispatch(setNoteStats(combinedStats));
      dispatch(setReactionsInterval(interval));
      setErrorReactions(null);
      dispatch(setLoadingReactions(false));
    } catch (error: any) {
      setErrorReactions(
        error instanceof Error ? error.message : "An unknown error occurred",
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
      const response = await getNotesWithStatsForDate(date);
      dispatch(setNotesForDate(response || []));
    } catch (error: any) {
      Logger.error("Error fetching notes for date:", error);
      dispatch(setNotesForDate([]));
    } finally {
      dispatch(setLoadingNotesForDate(false));
    }
  };

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
    fetchStreakData,
    fetchTopEngagers,
    updateNotesStatistics,
    getNotesStatistics: fetchNotesForDate,
  };
}

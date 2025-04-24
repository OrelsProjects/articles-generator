import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  setStreak,
  selectStatistics,
} from "@/lib/features/statistics/statisticsSlice";
import { Streak } from "@/types/notes-stats";

export function useNotesStats() {
  const { streak } = useSelector(selectStatistics);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    async function fetchStreakData() {
      try {
        // Only fetch if we don't already have data
        if (streak.length === 0 && !loadingRef.current) {
          loadingRef.current = true;
          setLoading(true);
          const response = await axios.get<Streak[]>(
            "/api/user/notes/stats/streak",
          );
          dispatch(setStreak(response.data));
          setError(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }

    fetchStreakData();
  }, [dispatch, streak.length, loading]);

  return { streak, loading, error };
}

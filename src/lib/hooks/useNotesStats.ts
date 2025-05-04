import { useEffect, useMemo, useRef, useState } from "react";
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
      if (streak.length > 0 || loading) {
        return;
      }
      try {
        setLoading(true);
        console.log("fetching streak data");
        // Only fetch if we don't already have data
        loadingRef.current = true;
        const response = await axios.get<Streak[]>(
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

    fetchStreakData();
  }, []);

  const streakCount = useMemo(() => {
    // Count, from today back, exclude today, streaks with >0 notes
    const noted = new Set<string>();
    for (const { year, month, day, notes } of streak) {
      if (notes > 0) {
        const key = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        noted.add(key);
      }
    }

    if (noted.size === 0) {
      return 0; // no notes ever
    }

    // 2) Find the last (max) date in the entries
    const lastDate = Array.from(noted)
      .map(key => new Date(key + "T00:00:00"))
      .reduce((a, b) => (a.getTime() > b.getTime() ? a : b));
    // clamp to midnight local
    lastDate.setHours(0, 0, 0, 0);

    // 3) Walk backwards day by day until you hit a miss
    let currentStreak = 0;
    const cursor = new Date(lastDate);
    while (true) {
      const yy = cursor.getFullYear().toString().padStart(4, "0");
      const mm = (cursor.getMonth() + 1).toString().padStart(2, "0");
      const dd = cursor.getDate().toString().padStart(2, "0");
      const key = `${yy}-${mm}-${dd}`;

      if (noted.has(key)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  }, [streak]);

  return { streak, streakCount, loading, error };
}

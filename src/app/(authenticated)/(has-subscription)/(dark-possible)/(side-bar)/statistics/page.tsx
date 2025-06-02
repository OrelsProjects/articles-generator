"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import ActivityHeatmap from "@/components/ui/activity-heatmap";
import TopEngagers from "@/app/(free)/fans/components/top-engagers";
import { Engager } from "@/types/engager";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { NotesReactionsChart } from "@/components/stats/NotesReactionsChart";
import { NotesEngagementChart } from "@/components/stats/NotesEngagementChart";
import { Logger } from "@/logger";
import { Button } from "@/components/ui/button";
import { ReactionInterval } from "@/types/notes-stats";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { TopNotesTabs } from "@/components/stats/TopNotesTabs";

const intervalLabels: Record<ReactionInterval, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

const intervalOptions: ReactionInterval[] = ["day", "week", "month", "year"];

export default function StatisticsPage() {
  const {
    streak,
    loading,
    error,
    topEngagers,
    errorEngagers,
    fetchStreakData,
    fetchTopEngagers,
    fetchReactions,
    reactionsInterval,
    changeReactionsInterval,
    isFetchingNotesStats,
  } = useNotesStats();
  const loadingRef = useRef(false);
  const router = useCustomRouter();
  const [isChangingInterval, setIsChangingInterval] = useState(false);

  const handleEngagerClick = (engager: Engager) => {
    router.push(`https://www.substack.com/@${engager.handle}`, {
      newTab: true,
    });
  };

  const handleIntervalChange = async (interval: ReactionInterval) => {
    if (interval === reactionsInterval) return;
    setIsChangingInterval(true);
    try {
      await changeReactionsInterval(interval);
    } finally {
      setIsChangingInterval(false);
    }
  };

  const fetchData = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      fetchStreakData().catch(error => {
        Logger.error("Error fetching streak data:", error);
      });
      fetchTopEngagers().catch(error => {
        Logger.error("Error fetching top engagers:", error);
      });
      fetchReactions().catch(error => {
        Logger.error("Error fetching reactions:", error);
      });
    } catch (error: any) {
      Logger.error("Error fetching notes stats:", error);
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-8 pb-20 md:pb-8">
      <div>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Notes Statistics</h2>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 bg-muted/50 p-1 rounded-lg relative"
              >
                {isChangingInterval && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                {intervalOptions.map(interval => (
                  <Button
                    key={interval}
                    variant={reactionsInterval === interval ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleIntervalChange(interval)}
                    disabled={loading || isChangingInterval}
                    className={cn(
                      "text-xs transition-all duration-200",
                      reactionsInterval === interval && "shadow-sm"
                    )}
                  >
                    {intervalLabels[interval]}
                  </Button>
                ))}
              </motion.div>
            </div>
            <p className="text-muted-foreground text-sm">
              View your notes statistics across different time periods. Select an interval above to adjust the time range for all charts.
            </p>
          </div>
          <NotesEngagementChart isLoading={isChangingInterval || isFetchingNotesStats} />
          <NotesReactionsChart isLoading={isChangingInterval || isFetchingNotesStats} />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your Writing Activity</h1>
        <p className="text-muted-foreground mb-6">
          Track your daily writing habits and see your streak progress over
          time.
        </p>

        {error ? (
          <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">
            Failed to load streak data: {error}
          </div>
        ) : (
          <ActivityHeatmap streakData={streak || []} loading={loading} />
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Your Top Fans</h2>
        <p className="text-muted-foreground mb-6">
          People who engage the most with your content.
        </p>
        {errorEngagers ? (
          <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">
            Failed to load top engagers: {errorEngagers}
          </div>
        ) : (
          <TopEngagers
            engagers={topEngagers || []}
            loading={loading}
            onClick={handleEngagerClick}
            title=""
            maxDisplayCount={100}
            className="mt-4"
            hideFakes={true}
          />
        )}
      </div>

      {/* <div className="mt-12">
        <TopNotesTabs isLoading={isChangingInterval || isFetchingNotesStats} />
      </div> */}
    </div>
  );
}

"use client";

import React from "react";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import ActivityHeatmap from "@/components/ui/activity-heatmap";
import TopEngagers from "@/app/(free)/fans/components/top-engagers";
import { Engager } from "@/types/engager";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { NotesReactionsChart } from "@/components/stats/NotesReactionsChart";
import { NotesEngagementChart } from "@/components/stats/NotesEngagementChart";

export default function StatisticsPage() {
  const { streak, loading, error, topEngagers, errorEngagers } =
    useNotesStats();
  const router = useCustomRouter();

  const handleEngagerClick = (engager: Engager) => {
    router.push(`https://www.substack.com/@${engager.handle}`, {
      newTab: true,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8 pb-20 md:pb-8">
      <div>
        <div className="flex flex-col gap-4 mb-8">
          <NotesEngagementChart />
          <NotesReactionsChart />
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
    </div>
  );
}

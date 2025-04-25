"use client";

import React from "react";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import ActivityHeatmap from "@/components/ui/activity-heatmap";

export default function StatisticsPage() {
  const { streak, loading, error } = useNotesStats();

  return (
    <div className="container mx-auto py-8 space-y-8 pb-20 md:pb-8">
      <div>
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
{/* 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Writing Insights</h2>
          <p className="text-muted-foreground">
            Visualize your consistency and productivity patterns to improve your
            writing routine.
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-muted-foreground">
            We&apos;re working on more statistics and insights for your writing
            journey.
          </p>
        </div>
      </div> */}
    </div>
  );
}

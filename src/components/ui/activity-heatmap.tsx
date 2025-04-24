"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Streak } from "@/types/notes-stats";

interface ActivityHeatmapProps {
  streakData?: Streak[];
  loading?: boolean;
}

export default function ActivityHeatmap({
  streakData = [],
  loading = false,
}: ActivityHeatmapProps) {
  const today = useMemo(() => new Date(), []);
  const startDate = useMemo(() => subDays(today, 240), [today]); // About 8 months back

  // Memoize days to prevent recalculation on each render
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: today,
    });
  }, [startDate, today]);

  // Transform Streak data into the format needed for the heatmap
  const [activityData, setActivityData] = useState<Record<string, number>>({});

  useEffect(() => {
    const data: Record<string, number> = {};

    // Initialize all days with 0
    days.forEach(day => {
      data[format(day, "yyyy-MM-dd")] = 0;
    });

    // Fill in the activity data from streakData
    streakData.forEach(item => {
      if (item && item.date) {
        const dateKey = format(new Date(item.date), "yyyy-MM-dd");
        data[dateKey] = item.notes;
      }
    });

    setActivityData(data);
  }, [streakData, days]);

  // Find the maximum activity value for normalization
  const maxActivity = useMemo(() => {
    return Math.max(
      1, // Ensure we don't divide by zero
      ...Object.values(activityData).filter(val => val > 0),
    );
  }, [activityData]);

  // Function to normalize activity to a 0-4 scale (5 levels)
  const normalizeActivity = (value: number): number => {
    if (value === 0) return 0;
    return Math.ceil((value / maxActivity) * 4);
  };

  // Calculate current streak
  const streak = useMemo(() => {
    let count = 0;
    let currentDate = today;

    while (true) {
      const dateKey = format(currentDate, "yyyy-MM-dd");
      if (activityData[dateKey] > 0) {
        count++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return count;
  }, [activityData, today]);

  // Group days by week for the grid layout
  const { weeks, monthLabels } = useMemo(() => {
    const weeksArray = [];
    let currentWeek: Date[] = [];

    // Get day of week (0 = Sunday, 6 = Saturday)
    const getDay = (date: Date) => date.getDay();

    // Fill in any missing days at the start to align with weekdays
    const firstDay = getDay(days[0]);
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(subDays(days[0], firstDay - i));
    }

    // Add all days to weeks
    for (const day of days) {
      if (getDay(day) === 0 && currentWeek.length > 0) {
        weeksArray.push([...currentWeek]);
        currentWeek = [];
      }
      currentWeek.push(day);
    }

    // Add the last week if it's not empty
    if (currentWeek.length > 0) {
      weeksArray.push([...currentWeek]);
    }

    // Get month labels for the x-axis
    const monthLabelsArray: { date: Date; label: string }[] = [];
    let currentMonth = "";

    days.forEach(day => {
      const month = format(day, "MMM dd");
      if (month.includes("01") || month.includes("15")) {
        if (month !== currentMonth) {
          currentMonth = month;
          monthLabelsArray.push({
            date: day,
            label: format(day, "MMM dd"),
          });
        }
      }
    });

    return {
      weeks: weeksArray,
      monthLabels: monthLabelsArray.filter((_, i) => i % 2 === 0), // Filter to avoid overcrowding
    };
  }, [days]);

  const getCellColor = (normalizedLevel: number) => {
    return cn(
      "h-[20px] w-[20px] rounded-sm",
      normalizedLevel === 0 && "bg-blue-50 dark:bg-slate-800",
      normalizedLevel === 1 && "bg-orange-100",
      normalizedLevel === 2 && "bg-orange-200",
      normalizedLevel === 3 && "bg-orange-400",
      normalizedLevel === 4 && "bg-orange-600",
    );
  };

  const renderLoadingSkeleton = () => {
    return (
      <>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div className="flex">
          {/* Day labels skeleton */}
          <div className="flex flex-col text-xs pr-2 space-y-[22px]">
            {["Sun", "Tue", "Thu", "Sat"].map((day, i) => (
              <div key={i} className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Grid skeleton */}
              <div className="flex flex-col gap-[2px]">
                <div className="grid grid-cols-[repeat(53,_minmax(0,_1fr))] gap-[24px]">
                  {Array.from({ length: 53 }).map((_, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[2px]">
                      {Array.from({ length: 7 }).map((_, dayIndex) => (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className="h-[20px] w-[20px] rounded-sm bg-gray-200 dark:bg-gray-700 animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Month labels skeleton */}
                <div className="flex text-xs mt-1 relative h-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                      style={{ left: `${i * 16}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex justify-end items-center gap-2 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="w-[20px] h-[20px] rounded-sm bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </React.Fragment>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm w-full">
      {loading ? (
        renderLoadingSkeleton()
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 rounded-full bg-orange-500"></div>
            <h3 className="text-lg font-medium">
              {streak}-day streak, {streak === 0 ? "oh c'mon" : "keep it up!"}
            </h3>
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col text-xs text-muted-foreground pr-2 space-y-[22px]">
              <div>Sun</div>
              <div>Tue</div>
              <div>Thu</div>
              <div>Sat</div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Grid */}
                <div className="flex flex-col gap-[2px]">
                  <div className="grid grid-cols-[repeat(53,_minmax(0,_1fr))] gap-[24px]">
                    <TooltipProvider>
                      {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[2px]">
                          {Array.from({ length: 7 }).map((_, dayIndex) => {
                            const day = week[dayIndex];
                            if (!day)
                              return (
                                <div
                                  key={dayIndex}
                                  className="h-[20px] w-[20px]"
                                ></div>
                              );

                            const dateKey = format(day, "yyyy-MM-dd");
                            const activityValue = activityData[dateKey] || 0;
                            const normalizedLevel =
                              normalizeActivity(activityValue);

                            return (
                              <Tooltip key={dateKey}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      getCellColor(normalizedLevel),
                                      "hover:border hover:border-gray-300",
                                    )}
                                  />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="font-medium py-1 px-2 rounded border-none"
                                >
                                  <p>
                                    {activityValue}{" "}
                                    {activityValue === 1 ? "note" : "notes"} <br />
                                    on {format(day, "EEE, MMM d, yyyy")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      ))}
                    </TooltipProvider>
                  </div>

                  {/* Month labels */}
                  <div className="flex text-xs text-muted-foreground mt-1 relative h-6">
                    {monthLabels.map((item, index) => {
                      // Calculate position based on days since start
                      const daysSinceStart = Math.floor(
                        (item.date.getTime() - startDate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const position = (daysSinceStart / days.length) * 80;

                      return (
                        <div
                          key={index}
                          className="absolute"
                          style={{ left: `${position}%` }}
                        >
                          {format(item.date, "MMM dd")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-end items-center gap-2 mt-2 text-xs text-muted-foreground">
            <div className="w-[20px] h-[20px] rounded-sm bg-blue-50 dark:bg-slate-800"></div>
            <span>0</span>
            <div className="w-[20px] h-[20px] rounded-sm bg-orange-100"></div>
            <span>1-{Math.ceil(maxActivity / 4)}</span>
            <div className="w-[20px] h-[20px] rounded-sm bg-orange-200"></div>
            <span>
              {Math.ceil(maxActivity / 4) + 1}-{Math.ceil(maxActivity / 2)}
            </span>
            <div className="w-[20px] h-[20px] rounded-sm bg-orange-400"></div>
            <span>
              {Math.ceil(maxActivity / 2) + 1}-{Math.ceil((3 * maxActivity) / 4)}
            </span>
            <div className="w-[20px] h-[20px] rounded-sm bg-orange-600"></div>
            <span>
              {Math.ceil((3 * maxActivity) / 4) + 1}-{maxActivity}
            </span>
          </div>
        </>
      )}
      
      {/* Disclaimer - shown always */}
      <div className="text-xs text-muted-foreground mt-4 italic">
        The data updates every 24 hours.
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import { ReactionInterval } from "@/types/notes-stats";
import {
  BarChart3,
  PuzzleIcon,
  Users,
  UserPlus,
  CreditCard,
  CoinsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CompactNoteComponent } from "@/components/stats/CompactNoteComponent";
import { useExtension } from "@/lib/hooks/useExtension";
import { useAppSelector } from "@/lib/hooks/redux";

type MetricType =
  | "clicks"
  | "follows"
  | "paid Subscriptions"
  | "free Subscriptions"
  | null;

const formatPeriod = (period: string, interval: ReactionInterval) => {
  const date = new Date(period);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    // If the date is invalid, try to parse it as YYYY-MM-DD or other formats
    const dateParts = period.split("-");
    if (dateParts.length === 3) {
      const [year, month, day] = dateParts.map(Number);
      const parsedDate = new Date(year, month - 1, day); // month is 0-indexed
      if (!isNaN(parsedDate.getTime())) {
        switch (interval) {
          case "day":
            return parsedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          case "week":
            return `${parsedDate.getMonth() + 1}/${parsedDate.getDate()}`;
          case "month":
            return parsedDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          case "year":
            return parsedDate.getFullYear().toString();
          default:
            return period;
        }
      }
    }
    // If still can't parse, return the original period
    return period;
  }

  switch (interval) {
    case "day":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "week":
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case "month":
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    case "year":
      return date.getFullYear().toString();
    default:
      return period;
  }
};

const CustomTooltip = ({
  active,
  payload,
  label,
  interval,
  isNormalized,
  originalData,
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">
          {formatPeriod(label, interval)}
        </p>
        {payload.map((entry: any, index: number) => {
          const originalValue =
            isNormalized && originalData
              ? originalData.find((d: any) => d.period === label)?.[
                  entry.dataKey
                ]
              : null;

          return (
            <div key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-semibold">{entry.value}</span>{" "}
              {entry.dataKey}
              {originalValue && originalValue !== entry.value && (
                <span className="text-xs text-muted-foreground ml-1">
                  (was {originalValue})
                </span>
              )}
            </div>
          );
        })}
        {isNormalized && (
          <p className="text-xs text-muted-foreground mt-1 border-t pt-1">
            Outliers normalized for better visualization
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface NotesEngagementChartProps {
  isLoading?: boolean;
}

export function NotesEngagementChart({ isLoading }: NotesEngagementChartProps) {
  const { isFetchingNotesStats } = useAppSelector(state => state.statistics);
  const {
    noteStats,
    notesForDate,
    loadingReactions,
    loadingNotesForDate,
    reactionsInterval,
    errorReactions,
    fetchReactions,
    fetchNotesForDate,
  } = useNotesStats();
  const { hasExtension } = useExtension();

  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [normalizeData, setNormalizeData] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  const refreshDataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Combine all the data into a single array for the chart
  const { chartData, originalData } = useMemo(() => {
    if (!noteStats) return { chartData: [], originalData: [] };

    // Get all unique periods
    const allPeriods = new Set([
      ...noteStats.totalClicks?.map(r => r.period),
      ...noteStats.totalFollows?.map(r => r.period),
      ...noteStats.totalPaidSubscriptions?.map(r => r.period),
      ...noteStats.totalFreeSubscriptions?.map(r => r.period),
    ]);

    if (allPeriods.size === 0) return { chartData: [], originalData: [] };

    // Create combined data array
    const rawData = Array.from(allPeriods)
      .sort()
      .map(period => {
        const clicks =
          noteStats.totalClicks.find(r => r.period === period)?.total || 0;
        const follows =
          noteStats.totalFollows.find(r => r.period === period)?.total || 0;
        const paidSubscriptions =
          noteStats.totalPaidSubscriptions.find(r => r.period === period)
            ?.total || 0;
        const freeSubscriptions =
          noteStats.totalFreeSubscriptions.find(r => r.period === period)
            ?.total || 0;
        return {
          period,
          clicks,
          follows,
          paidSubscriptions,
          freeSubscriptions,
        };
      });

    if (!normalizeData) return { chartData: rawData, originalData: rawData };

    // Apply normalization to handle viral outliers
    const normalizeMetric = (values: number[]) => {
      if (values.length === 0) return values;

      // Calculate percentiles
      const sorted = [...values].sort((a, b) => a - b);
      const q75Index = Math.floor(sorted.length * 0.75);
      const q95Index = Math.floor(sorted.length * 0.95);
      const q75 = sorted[q75Index];
      const q95 = sorted[q95Index];

      // Calculate IQR-based cap (more conservative than just using max)
      const iqr = q95 - q75;
      const cap = q95 + iqr * 1.5;

      // Apply cap to values
      return values.map(value => Math.min(value, cap));
    };

    if (!rawData || rawData.length === 0)
      return { chartData: [], originalData: [] };

    const clicks = rawData.map(d => d.clicks);
    const follows = rawData.map(d => d.follows);
    const paidSubscriptions = rawData.map(d => d.paidSubscriptions);
    const freeSubscriptions = rawData.map(d => d.freeSubscriptions);

    const normalizedClicks = normalizeMetric(clicks);
    const normalizedFollows = normalizeMetric(follows);
    const normalizedPaidSubscriptions = normalizeMetric(paidSubscriptions);
    const normalizedFreeSubscriptions = normalizeMetric(freeSubscriptions);

    const normalizedData = rawData.map((item, index) => ({
      ...item,
      clicks: normalizedClicks[index],
      follows: normalizedFollows[index],
      paidSubscriptions: normalizedPaidSubscriptions[index],
      freeSubscriptions: normalizedFreeSubscriptions[index],
    }));

    return { chartData: normalizedData, originalData: rawData };
  }, [noteStats, normalizeData]);

  useEffect(() => {
    // If no engagement data, fetch it every 60 seconds
    if (chartData.length === 0) {
      refreshDataIntervalRef.current = setInterval(() => {
        fetchReactions();
      }, 60000);
      return () => {
        if (refreshDataIntervalRef.current) {
          clearInterval(refreshDataIntervalRef.current);
        }
      };
    }
  }, [chartData, fetchReactions]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (chartData.length === 0) {
          fetchReactions();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [chartData, fetchReactions]);

  useEffect(() => {
    if (!isFetchingNotesStats && !noteStats) {
      fetchReactions();
    }
  }, [isFetchingNotesStats]);

  useEffect(() => {
    const checkExtensionInstalled = async () => {
      const result = await hasExtension({
        showDialog: false,
        throwIfNoExtension: true,
      });
      setExtensionInstalled(result);
    };
    checkExtensionInstalled();
  }, [hasExtension]);

  const handleDotClick = async (period: string) => {
    if (!period) return;

    try {
      setSelectedDate(period);
      setIsPopoverOpen(true);
      await fetchNotesForDate(period);
    } catch (error) {
      console.error("Error fetching notes for date:", error);
    }
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const period = data.activePayload[0].payload.period;
      if (period) {
        handleDotClick(period);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    // Track mouse position for potential popover positioning
    if (chartContainerRef.current) {
      const rect = chartContainerRef.current.getBoundingClientRect();
      setClickPosition({
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const renderChart = (
    dataKey: string,
    title: string,
    color: string,
    gradientId: string,
    className?: string,
    dummyData?: {
      period: string;
      clicks: number;
      follows: number;
      paidSubscriptions: number;
      freeSubscriptions: number;
    }[],
  ) => {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={chartContainerRef}
            className="h-[200px] w-full"
            onMouseMove={handleMouseMove}
          >
            {loadingReactions || isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dummyData || chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: reactionsInterval === "week" ? 60 : 5,
                  }}
                  className="h-full"
                  onClick={handleChartClick}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="opacity-30 h-full"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <XAxis
                    dataKey="period"
                    tickFormatter={value =>
                      formatPeriod(value, reactionsInterval)
                    }
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={
                      reactionsInterval === "day"
                        ? "preserveStartEnd"
                        : reactionsInterval === "week"
                          ? Math.max(Math.floor(chartData.length / 8), 0)
                          : 0
                    }
                    angle={reactionsInterval === "week" ? -45 : 0}
                    textAnchor={reactionsInterval === "week" ? "end" : "middle"}
                    height={reactionsInterval === "week" ? 60 : 30}
                  />
                  <YAxis
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        interval={reactionsInterval}
                        isNormalized={normalizeData}
                        originalData={originalData}
                      />
                    }
                  />
                  <Area
                    type={reactionsInterval === "day" ? "basis" : "monotone"}
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={
                      reactionsInterval === "day"
                        ? false
                        : {
                            fill: color,
                            strokeWidth: 2,
                            r: 3,
                          }
                    }
                    activeDot={{
                      r: 5,
                      fill: color,
                      strokeWidth: 2,
                      stroke: "hsl(var(--background))",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!extensionInstalled) {
    const handleInstall = () => {
      // Open Chrome extension store in a new tab
      window.open(
        process.env.NEXT_PUBLIC_EXTENSION_URL ||
          "https://chrome.google.com/webstore/category/extensions",
        "_blank",
      );
    };

    const handleRefresh = () => {
      window.location.reload();
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PuzzleIcon className="h-5 w-5 text-primary" />
            Chrome Extension Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              In order to see how many subscribers, free or paid, you got from
              your notes, you&apos;ll need to install our Chrome extension.
            </p>
            <p className="text-foreground">
              <span
                onClick={handleRefresh}
                className="text-primary cursor-pointer underline"
              >
                (Refresh after installation)
              </span>
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="ghost" onClick={handleRefresh}>
                Refresh
              </Button>
              <Button variant="neumorphic-primary" onClick={handleInstall}>
                Let&apos;s go!
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorReactions) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Engagement Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load statistics data</p>
            <p className="text-sm text-muted-foreground mt-2">
              {errorReactions}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 hidden lg:block"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Total Follows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              ) : (
                noteStats?.engagementTotals?.follows.toLocaleString() || 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Free Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              ) : (
                noteStats?.engagementTotals?.freeSubscriptions.toLocaleString() ||
                0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CoinsIcon className="h-4 w-4 text-primary" />
              Paid Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              ) : (
                noteStats?.engagementTotals?.paidSubscriptions.toLocaleString() ||
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {isFetchingNotesStats && !noteStats ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              Your data is being loaded...
            </p>
            <p className="text-sm text-muted-foreground">
              Please keep WriteStack open for a few minutes until the data is
              fully fetched.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Full width subscription charts */}
          {renderChart(
            "freeSubscriptions",
            "Free Subscriptions Over Time",
            "#a855f7",
            "freeSubscriptionsGradient",
            "w-full",
          )}

          {/* Dummy free subscriptions data starting from Feb 11, 2024 */}
          {/* {renderChart(
            "freeSubscriptions",
            "Free Subscriptions Over Time",
            "#a855f7",
            "freeSubscriptionsGradient",
            "w-full",
            generateMessyGrowingStats("2024-02-11", 30, 4397),
          )}
          {renderChart(
            "freeSubscriptions",
            "Paid Subscriptions Over Time",
            "#3b82f6",
            "paidSubscriptionsGradient",
            "w-full",
            generateMessyGrowingStats("2024-02-11", 30, 371),
          )} */}

          {renderChart(
            "paidSubscriptions",
            "Paid Subscriptions Over Time",
            "#3b82f6",
            "paidSubscriptionsGradient",
            "w-full",
          )}

          {/* Side by side engagement charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderChart(
              "clicks",
              "Note Clicks Over Time",
              "hsl(var(--primary))",
              "clicksGradient",
            )}
            {renderChart(
              "follows",
              "Follows Over Time",
              "#22c55e",
              "followsGradient",
            )}
          </div>
        </div>
      )}

      {/* Notes Popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div 
            style={{ 
              position: "fixed",
              left: clickPosition?.x || 0,
              top: clickPosition?.y || 0,
              width: 1,
              height: 1,
              pointerEvents: "none",
              opacity: 0
            }} 
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-96 max-h-[500px] overflow-y-auto"
          side="top"
          align="center"
          sideOffset={10}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Notes for{" "}
                {selectedDate && formatPeriod(selectedDate, reactionsInterval)}
              </h3>
            </div>
            <div className="w-full flex items-center justify-center">
              {loadingNotesForDate && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
            </div>
            {notesForDate?.length === 0 && !loadingNotesForDate ? (
              <p className="text-sm text-muted-foreground">
                No notes found for this date.
              </p>
            ) : (
              <div className="space-y-3">
                {notesForDate?.map(note => (
                  <CompactNoteComponent
                    loading={loadingNotesForDate}
                    key={note.id}
                    note={note}
                  />
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}

type DailyStat = {
  period: string;
  clicks: number;
  follows: number;
  paidSubscriptions: number;
  freeSubscriptions: number;
};

// function generateMessyGrowingStats(
//   startDateStr: string,
//   days: number,
//   totalFreeSubs: number,
// ): DailyStat[] {
//   const startDate = new Date(startDateStr);
//   const raw: number[] = [];

//   // Create a base curve with exponential-ish growth and noise
//   for (let i = 0; i < days; i++) {
//     const progress = i / (days - 1);
//     const base = Math.pow(progress, 1.7); // starts slow, grows hard
//     const chaos = Math.sin(i * 0.9 + Math.random() * 2) * 0.3; // chaotic but smoothish
//     const noise = 1 + chaos + (Math.random() - 0.5) * 0.4; // more noise
//     raw.push(Math.max(0, base * noise)); // avoid negatives
//   }

//   // Normalize to totalFreeSubs
//   const totalRaw = raw.reduce((sum, n) => sum + n, 0);
//   const scaled = raw.map(n => (n / totalRaw) * totalFreeSubs);
//   const rounded = scaled.map(n => Math.round(n));

//   // Fix rounding errors
//   let diff = totalFreeSubs - rounded.reduce((sum, val) => sum + val, 0);
//   while (diff !== 0) {
//     const i = Math.floor(Math.random() * days);
//     if (diff > 0) {
//       rounded[i]++;
//       diff--;
//     } else if (rounded[i] > 0) {
//       rounded[i]--;
//       diff++;
//     }
//   }

//   const stats: DailyStat[] = Array.from({ length: days }, (_, i) => {
//     const date = new Date(startDate);
//     date.setDate(date.getDate() + i);
//     return {
//       period: date.toISOString().split("T")[0],
//       clicks: 8,
//       follows: 0,
//       paidSubscriptions: 0,
//       freeSubscriptions: rounded[i],
//     };
//   });

//   return stats;
// }

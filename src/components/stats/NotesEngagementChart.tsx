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
import { BarChart3, PuzzleIcon } from "lucide-react";
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
export function NotesEngagementChart() {
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
  const [hoveredMetric, setHoveredMetric] = useState<MetricType>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(["clicks", "follows", "paidSubscriptions", "freeSubscriptions"]),
  );
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [normalizeData, setNormalizeData] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const refreshDataIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    const checkExtensionInstalled = async () => {
      const result = await hasExtension({
        showDialog: false,
        throwIfNoExtension: true,
      });
      setExtensionInstalled(result);
    };
    checkExtensionInstalled();
  }, [hasExtension]);

  const getOpacity = (metric: MetricType) => {
    if (hoveredMetric === null) return 1;
    return hoveredMetric === metric ? 1 : 0.3;
  };

  const toggleMetricVisibility = (metric: string) => {
    // If all metrics are visible, hide all but the one that is being toggled
    if (visibleMetrics.size === 4) {
      setVisibleMetrics(new Set([metric]));
      return;
    }

    // If only one metric is visible, and that one is being toggled, show all metrics
    if (visibleMetrics.size === 1) {
      if (visibleMetrics.has(metric)) {
        setVisibleMetrics(
          new Set([
            "clicks",
            "follows",
            "paidSubscriptions",
            "freeSubscriptions",
          ]),
        );
      } else {
        setVisibleMetrics(new Set([metric, ...Array.from(visibleMetrics)]));
      }
      return;
    }

    setVisibleMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metric)) {
        newSet.delete(metric);
      } else {
        newSet.add(metric);
      }
      return newSet;
    });
  };

  const isMetricVisible = (metric: string) => visibleMetrics.has(metric);

  const getBadgeOpacity = (metric: string) => {
    return isMetricVisible(metric) ? 1 : 0.5;
  };

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
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Follows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {noteStats?.engagementTotals?.follows.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Free Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {noteStats?.engagementTotals?.freeSubscriptions.toLocaleString() ||
                0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Paid Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {noteStats?.engagementTotals?.paidSubscriptions.toLocaleString() ||
                0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 mb-4">
              Engagement Statistics
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="normalize-data"
                  checked={normalizeData}
                  onCheckedChange={setNormalizeData}
                  disabled={loadingReactions}
                />
                <Label
                  htmlFor="normalize-data"
                  className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Normalize outliers
                </Label>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {normalizeData && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                <BarChart3 className="h-3 w-3" />
                <span>Outliers normalized</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer transition-all duration-200",
                  hoveredMetric === "clicks" ? "ring-2 ring-primary" : "",
                  !isMetricVisible("clicks") && "opacity-50",
                )}
                style={{ opacity: getBadgeOpacity("clicks") }}
                onMouseEnter={() => setHoveredMetric("clicks")}
                onMouseLeave={() => setHoveredMetric(null)}
                onClick={() => toggleMetricVisibility("clicks")}
              >
                <div className="w-2 h-2 rounded-full bg-primary mr-1"></div>
                Note clicks
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer transition-all duration-200",
                  hoveredMetric === "follows" ? "ring-2 ring-green-500" : "",
                  !isMetricVisible("follows") && "opacity-50",
                )}
                style={{ opacity: getBadgeOpacity("follows") }}
                onMouseEnter={() => setHoveredMetric("follows")}
                onMouseLeave={() => setHoveredMetric(null)}
                onClick={() => toggleMetricVisibility("follows")}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                Follows
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer transition-all duration-200",
                  hoveredMetric === "paid Subscriptions"
                    ? "ring-2 ring-blue-500"
                    : "",
                  !isMetricVisible("paidSubscriptions") && "opacity-50",
                )}
                style={{ opacity: getBadgeOpacity("paid Subscriptions") }}
                onMouseEnter={() => setHoveredMetric("paid Subscriptions")}
                onMouseLeave={() => setHoveredMetric(null)}
                onClick={() => toggleMetricVisibility("paidSubscriptions")}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                Paid Subscriptions
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer transition-all duration-200",
                  hoveredMetric === "free Subscriptions"
                    ? "ring-2 ring-purple-500"
                    : "",
                  !isMetricVisible("freeSubscriptions") && "opacity-50",
                )}
                style={{ opacity: getBadgeOpacity("freeSubscriptions") }}
                onMouseEnter={() => setHoveredMetric("free Subscriptions")}
                onMouseLeave={() => setHoveredMetric(null)}
                onClick={() => toggleMetricVisibility("freeSubscriptions")}
              >
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
                Free Subscriptions
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loadingReactions ? (
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
                  Please keep WriteStack open for a few minutes until the data
                  is fully fetched.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
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
                    <linearGradient
                      id="clicksGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id="followsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#22c55e"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id="paidSubscriptionsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id="freeSubscriptionsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#a855f7"
                        stopOpacity={0.05}
                      />
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

                  {/* Clicks Area */}
                  {isMetricVisible("clicks") && (
                    <Area
                      type={reactionsInterval === "day" ? "basis" : "monotone"}
                      dataKey="clicks"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#clicksGradient)"
                      fillOpacity={getOpacity("clicks")}
                      strokeOpacity={getOpacity("clicks")}
                      //   dot={{
                      //     fill: "hsl(var(--primary))",
                      //     strokeWidth: 2,
                      //     r: 4,
                      //     cursor: "pointer",
                      //   }}
                      activeDot={{
                        r: 6,
                        fill: "hsl(var(--primary))",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setHoveredMetric("clicks")}
                      onMouseLeave={() => setHoveredMetric(null)}
                    />
                  )}

                  {/* Follows Area */}
                  {isMetricVisible("follows") && (
                    <Area
                      type={reactionsInterval === "day" ? "basis" : "monotone"}
                      dataKey="follows"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#followsGradient)"
                      fillOpacity={getOpacity("follows")}
                      strokeOpacity={getOpacity("follows")}
                      dot={
                        reactionsInterval === "day"
                          ? false
                          : {
                              fill: "#22c55e",
                              strokeWidth: 2,
                              r: 3,
                              fillOpacity: getOpacity("follows"),
                            }
                      }
                      activeDot={{
                        r: 5,
                        fill: "#22c55e",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      onMouseEnter={() => setHoveredMetric("follows")}
                      onMouseLeave={() => setHoveredMetric(null)}
                    />
                  )}

                  {/* Paid Subscriptions Area */}
                  {isMetricVisible("paidSubscriptions") && (
                    <Area
                      type={reactionsInterval === "day" ? "basis" : "monotone"}
                      dataKey="paidSubscriptions"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#paidSubscriptionsGradient)"
                      fillOpacity={getOpacity("paid Subscriptions")}
                      strokeOpacity={getOpacity("paid Subscriptions")}
                      dot={
                        reactionsInterval === "day"
                          ? false
                          : {
                              fill: "#3b82f6",
                              strokeWidth: 2,
                              r: 3,
                              fillOpacity: getOpacity("paid Subscriptions"),
                            }
                      }
                      activeDot={{
                        r: 5,
                        fill: "#3b82f6",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      onMouseEnter={() =>
                        setHoveredMetric("paid Subscriptions")
                      }
                      onMouseLeave={() => setHoveredMetric(null)}
                    />
                  )}

                  {/* Free Subscriptions Area */}
                  {isMetricVisible("freeSubscriptions") && (
                    <Area
                      type={reactionsInterval === "day" ? "basis" : "monotone"}
                      dataKey="freeSubscriptions"
                      stroke="#a855f7"
                      strokeWidth={2}
                      fill="url(#freeSubscriptionsGradient)"
                      fillOpacity={getOpacity("free Subscriptions")}
                      strokeOpacity={getOpacity("free Subscriptions")}
                      dot={
                        reactionsInterval === "day"
                          ? false
                          : {
                              fill: "#a855f7",
                              strokeWidth: 2,
                              r: 3,
                              fillOpacity: getOpacity("free Subscriptions"),
                            }
                      }
                      activeDot={{
                        r: 5,
                        fill: "#a855f7",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      onMouseEnter={() =>
                        setHoveredMetric("free Subscriptions")
                      }
                      onMouseLeave={() => setHoveredMetric(null)}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div style={{ display: "none" }} />
        </PopoverTrigger>
        <PopoverContent
          className="w-96 max-h-[500px] overflow-y-auto"
          side="right"
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
                    key={note.commentId}
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

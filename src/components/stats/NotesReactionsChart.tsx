"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import { ReactionInterval, IntervalStats } from "@/types/notes-stats";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

const intervalLabels: Record<ReactionInterval, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

const intervalOptions: ReactionInterval[] = ["day", "week", "month", "year"];
type MetricType = "reactions" | "restacks" | "comments" | null;

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

const getTrendDirection = (data: IntervalStats[]) => {
  if (data.length < 2) return "neutral";

  const recent = data.slice(-3).map(d => d.total);
  const earlier = data.slice(-6, -3).map(d => d.total);

  if (recent.length === 0 || earlier.length === 0) return "neutral";

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

  if (recentAvg > earlierAvg * 1.05) return "up";
  if (recentAvg < earlierAvg * 0.95) return "down";
  return "neutral";
};

export function NotesReactionsChart() {
  const {
    noteStats,
    loadingReactions,
    errorReactions,
    reactionsInterval,
    changeReactionsInterval,
  } = useNotesStats();

  const [hoveredMetric, setHoveredMetric] = useState<MetricType>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(["reactions", "restacks", "comments"]),
  );
  const [normalizeData, setNormalizeData] = useState(false);

  useEffect(() => {
    if (errorReactions) {
      toast.error("Failed to load notes reactions stats");
    }
  }, [errorReactions]);

  // Combine all the data into a single array for the chart
  const { chartData, originalData } = useMemo(() => {
    if (!noteStats) return { chartData: [], originalData: [] };

    // Get all unique periods
    const allPeriods = new Set([
      ...noteStats.reactions.map(r => r.period),
      ...noteStats.restacks.map(r => r.period),
      ...noteStats.comments.map(r => r.period),
    ]);

    // Create combined data array
    const rawData = Array.from(allPeriods)
      .sort()
      .map(period => {
        const reactions =
          noteStats.reactions.find(r => r.period === period)?.total || 0;
        const restacks =
          noteStats.restacks.find(r => r.period === period)?.total || 0;
        const comments =
          noteStats.comments.find(r => r.period === period)?.total || 0;

        return {
          period,
          reactions,
          restacks,
          comments,
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

    const reactions = rawData.map(d => d.reactions);
    const restacks = rawData.map(d => d.restacks);
    const comments = rawData.map(d => d.comments);

    const normalizedReactions = normalizeMetric(reactions);
    const normalizedRestacks = normalizeMetric(restacks);
    const normalizedComments = normalizeMetric(comments);

    const normalizedData = rawData.map((item, index) => ({
      ...item,
      reactions: normalizedReactions[index],
      restacks: normalizedRestacks[index],
      comments: normalizedComments[index],
    }));

    return { chartData: normalizedData, originalData: rawData };
  }, [noteStats, normalizeData]);

  const stats = useMemo(() => {
    if (!noteStats)
      return {
        totalReactions: 0,
        totalRestacks: 0,
        totalComments: 0,
        avgReactions: 0,
      };

    const totalReactions = noteStats.reactions.reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const totalRestacks = noteStats.restacks.reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const totalComments = noteStats.comments.reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const avgReactions =
      noteStats.reactions.length > 0
        ? totalReactions / noteStats.reactions.length
        : 0;

    return { totalReactions, totalRestacks, totalComments, avgReactions };
  }, [noteStats]);

  const trend = getTrendDirection(noteStats?.reactions || []);
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
        ? "text-red-500"
        : "text-gray-500";

  const getOpacity = (metric: MetricType) => {
    if (hoveredMetric === null) return 1;
    return hoveredMetric === metric ? 1 : 0.3;
  };

  const toggleMetricVisibility = (metric: string) => {
    // If all metrics are visible, hide all but the one that is being toggled
    if (visibleMetrics.size === 3) {
      setVisibleMetrics(new Set([metric]));
      return;
    }

    // If only one metric is visible, and that one is being toggled, show all metrics
    if (visibleMetrics.size === 1) {
      if (visibleMetrics.has(metric)) {
        setVisibleMetrics(new Set(["reactions", "restacks", "comments"]));
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Notes Statistics
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
              <div className="flex gap-2">
                {intervalOptions.map(interval => (
                  <Button
                    key={interval}
                    variant={
                      reactionsInterval === interval ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => changeReactionsInterval(interval)}
                    disabled={loadingReactions}
                    className="text-xs"
                  >
                    {intervalLabels[interval]}
                  </Button>
                ))}
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
                  hoveredMetric === "reactions" ? "ring-2 ring-primary" : "",
                  !isMetricVisible("reactions") && "opacity-50",
                )}
                style={{ opacity: getBadgeOpacity("reactions") }}
                onMouseEnter={() => setHoveredMetric("reactions")}
                onMouseLeave={() => setHoveredMetric(null)}
                onClick={() => toggleMetricVisibility("reactions")}
              >
                <div className="w-2 h-2 rounded-full bg-primary mr-1"></div>
                Reactions: {stats.totalReactions.toLocaleString()}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer transition-all duration-200",
                  hoveredMetric === "restacks" ? "ring-2 ring-green-500" : "",
                  !isMetricVisible("restacks") && "opacity-50",
                  //   If not selected, opacity 0.5
                )}
                style={{ opacity: getBadgeOpacity("restacks") }}
                onMouseEnter={() => setHoveredMetric("restacks")}
                onMouseLeave={() => setHoveredMetric(null)}
                onClick={() => toggleMetricVisibility("restacks")}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                Restacks: {stats.totalRestacks.toLocaleString()}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer transition-all duration-200",
                  hoveredMetric === "comments" ? "ring-2 ring-blue-500" : "",
                  !isMetricVisible("comments") && "opacity-50",
                )}
                style={{ opacity: getBadgeOpacity("comments") }}
                onMouseEnter={() => setHoveredMetric("comments")}
                onMouseLeave={() => setHoveredMetric(null)}
                onClick={() => toggleMetricVisibility("comments")}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                Comments: {stats.totalComments.toLocaleString()}
              </Badge>
              <div className={cn("flex items-center gap-1", trendColor)}>
                {/* <TrendIcon className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {trend === "up" ? "Trending up" : trend === "down" ? "Trending down" : "Stable"}
                </span> */}
              </div>
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
              <div className="text-center">
                <p className="text-muted-foreground">
                  No statistics data available
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start publishing notes to see your statistics!
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
                >
                  <defs>
                    <linearGradient
                      id="reactionsGradient"
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
                      id="restacksGradient"
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
                      id="commentsGradient"
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

                  {/* Reactions Area */}
                  {isMetricVisible("reactions") && (
                    <Area
                      type={reactionsInterval === "day" ? "basis" : "monotone"}
                      dataKey="reactions"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#reactionsGradient)"
                      fillOpacity={getOpacity("reactions")}
                      strokeOpacity={getOpacity("reactions")}
                      dot={
                        reactionsInterval === "day"
                          ? false
                          : {
                              fill: "hsl(var(--primary))",
                              strokeWidth: 2,
                              r: 3,
                              fillOpacity: getOpacity("reactions"),
                            }
                      }
                      activeDot={{
                        r: 5,
                        fill: "hsl(var(--primary))",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      onMouseEnter={() => setHoveredMetric("reactions")}
                      onMouseLeave={() => setHoveredMetric(null)}
                    />
                  )}

                  {/* Restacks Area */}
                  {isMetricVisible("restacks") && (
                    <Area
                      type={reactionsInterval === "day" ? "basis" : "monotone"}
                      dataKey="restacks"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#restacksGradient)"
                      fillOpacity={getOpacity("restacks")}
                      strokeOpacity={getOpacity("restacks")}
                      dot={
                        reactionsInterval === "day"
                          ? false
                          : {
                              fill: "#22c55e",
                              strokeWidth: 2,
                              r: 3,
                              fillOpacity: getOpacity("restacks"),
                            }
                      }
                      activeDot={{
                        r: 5,
                        fill: "#22c55e",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      onMouseEnter={() => setHoveredMetric("restacks")}
                      onMouseLeave={() => setHoveredMetric(null)}
                    />
                  )}

                  {/* Comments Area */}
                  {isMetricVisible("comments") && (
                    <Area
                      type={reactionsInterval === "day" ? "basis" : "monotone"}
                      dataKey="comments"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#commentsGradient)"
                      fillOpacity={getOpacity("comments")}
                      strokeOpacity={getOpacity("comments")}
                      dot={
                        reactionsInterval === "day"
                          ? false
                          : {
                              fill: "#3b82f6",
                              strokeWidth: 2,
                              r: 3,
                              fillOpacity: getOpacity("comments"),
                            }
                      }
                      activeDot={{
                        r: 5,
                        fill: "#3b82f6",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      onMouseEnter={() => setHoveredMetric("comments")}
                      onMouseLeave={() => setHoveredMetric(null)}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

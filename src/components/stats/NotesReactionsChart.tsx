"use client";

import React from "react";
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
import { ReactionInterval } from "@/types/notes-stats";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const intervalLabels: Record<ReactionInterval, string> = {
  day: "Daily",
  week: "Weekly", 
  month: "Monthly",
  year: "Yearly",
};

const intervalOptions: ReactionInterval[] = ["day", "week", "month", "year"];

const formatPeriod = (period: string, interval: ReactionInterval) => {
  const date = new Date(period);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    // If the date is invalid, try to parse it as YYYY-MM-DD or other formats
    const dateParts = period.split('-');
    if (dateParts.length === 3) {
      const [year, month, day] = dateParts.map(Number);
      const parsedDate = new Date(year, month - 1, day); // month is 0-indexed
      if (!isNaN(parsedDate.getTime())) {
        switch (interval) {
          case "day":
            return parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          case "week":
            return `${parsedDate.getMonth() + 1}/${parsedDate.getDate()}`;
          case "month":
            return parsedDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "week":
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case "month":
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    case "year":
      return date.getFullYear().toString();
    default:
      return period;
  }
};

const CustomTooltip = ({ active, payload, label, interval }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">
          {formatPeriod(label, interval)}
        </p>
        <p className="text-sm text-primary">
          <span className="font-semibold">{payload[0].value}</span> reactions
        </p>
      </div>
    );
  }
  return null;
};

const getTrendDirection = (data: { total: number }[]) => {
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
    reactions,
    loadingReactions,
    errorReactions,
    reactionsInterval,
    changeReactionsInterval,
  } = useNotesStats();

  console.log("reactions", reactions);

  const totalReactions = reactions.reduce((sum, item) => sum + item.total, 0);
  const averageReactions = reactions.length > 0 ? totalReactions / reactions.length : 0;
  const trend = getTrendDirection(reactions);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500";

  if (errorReactions) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Notes Reactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load reactions data</p>
            <p className="text-sm text-muted-foreground mt-2">{errorReactions}</p>
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
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
               Notes Reactions
            </CardTitle>
            <div className="flex gap-2">
              {intervalOptions.map((interval) => (
                <Button
                  key={interval}
                  variant={reactionsInterval === interval ? "default" : "outline"}
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
          
          {/* Stats Summary */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Total: {totalReactions.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Avg: {Math.round(averageReactions).toLocaleString()}
              </Badge>
              <div className={cn("flex items-center gap-1", trendColor)}>
                {/* <TrendIcon className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {trend == "up" ? "Trending up" : trend === "down" ? "Trending down" : "Stable"}
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
          ) : reactions.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">No reaction data available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start publishing notes to see your reactions!
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={reactions}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: reactionsInterval === "week" ? 60 : 5,
                  }}
                >
                  <defs>
                    <linearGradient id="reactionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    className="opacity-30"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => formatPeriod(value, reactionsInterval)}
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={reactionsInterval === "day" ? "preserveStartEnd" : reactionsInterval === "week" ? Math.max(Math.floor(reactions.length / 8), 0) : 0}
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
                    content={<CustomTooltip interval={reactionsInterval} />}
                  />
                  <Area
                    type={reactionsInterval === "day" ? "basis" : "monotone"}
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#reactionGradient)"
                    dot={reactionsInterval === "day" ? false : {
                      fill: "hsl(var(--primary))",
                      strokeWidth: 2,
                      r: 3,
                    }}
                    activeDot={{
                      r: 5,
                      fill: "hsl(var(--primary))",
                      strokeWidth: 2,
                      stroke: "hsl(var(--background))",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 
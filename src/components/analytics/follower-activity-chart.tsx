import * as React from "react";
import { RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppSelector } from "@/lib/hooks/redux";
import { useQueue } from "@/lib/hooks/useQueue";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { convertHourUTCToHourLocal } from "@/lib/utils/date";
import { useMemo } from "react";
export interface FollowerActivityChartProps {}

// Component to display the follower activity chart
export function FollowerActivityChart({}: FollowerActivityChartProps) {
  const { bestTimeToPublish: data } = useAppSelector(state => state.statistics);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <p>No follower activity data available yet.</p>
        <p className="text-sm mt-2">
          As you publish more posts, we&apos;ll analyze when your audience
          engages most.
        </p>
      </div>
    );
  }

  // Find the max value for scaling
  const maxValue = Math.max(...data.map(item => item.adjustedAvgReaction));

  // Create an array of all 24 hours with their values
  const hourlyData = useMemo(() => {
    const localTimeHourlyData = data.map(item => {
      const hourLocal = convertHourUTCToHourLocal(parseInt(item.hourOfDayUTC));
      return {
        hour: hourLocal,
        value: item.adjustedAvgReaction / maxValue,
        rawValue: item.adjustedAvgReaction,
      };
    });
    // sort by hour. For indexes that have no corresponding hour, set to 0.
    // So, for example, index i may have hour 3. That's not good. 3 should be for index 3.
    const sortedData: { hour: number; value: number; rawValue: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const item = localTimeHourlyData.find(item => item.hour === i);
      if (item) {
        sortedData.push(item);
      } else {
        sortedData.push({
          hour: i,
          value: 0,
          rawValue: 0,
        });
      }
    }
    return sortedData;
  }, [data]);

  return (
    <div className="w-full pt-4 pb-2">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Times at which your followers are most active
      </h3>
      <div className="relative h-[200px] w-full">
        {/* Bars */}
        <div className="absolute bottom-8 left-8 right-8 top-4 flex items-end">
          {hourlyData.map(item => {
            // Use the normalized value for height (0-1 scale)
            // Min height of 5% for visibility of bars with very small values
            const normalizedHeight = item.value
              ? Math.max(item.value * 100, 1)
              : 0;
            return (
              <div
                className="flex-1 mx-0.5 bg-chart-1 transition-colors cursor-help"
                style={{ height: `${normalizedHeight}%` }}
              />
            );
          })}
        </div>

        {/* X-axis */}
        <div className="absolute bottom-0 left-8 right-8 flex justify-between text-xs text-muted-foreground">
          {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => (
            <div key={hour} className="flex flex-col items-center">
              <div className="h-2 w-px bg-border mb-1" />
              <span>{hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Y-axis label */}
      <div className="text-center text-xs text-muted-foreground">Time (h)</div>
      <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
        <Globe className="h-4 w-4 mr-2" />
        <span>
          Timezone:{" "}
          {Intl.DateTimeFormat().resolvedOptions().timeZone.replace("_", "/")}
        </span>
      </div>
    </div>
  );
}

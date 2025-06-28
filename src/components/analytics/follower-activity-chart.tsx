import * as React from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { convertHourUTCToHourLocal } from "@/lib/utils/date";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FollowerActivityChartProps {
  onTimeClicked: (hour: number, minutes: number) => void;
}

// Helper function to format hour (0-23) to readable time
function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

// Component to display the follower activity chart
export function FollowerActivityChart({
  onTimeClicked,
}: FollowerActivityChartProps) {
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
    <TooltipProvider delayDuration={50}>
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
                <Tooltip key={item.hour}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex-1 mx-0.5 bg-chart-1 transition-colors hover:bg-chart-1/80 cursor-pointer"
                      style={{ height: `${normalizedHeight}%` }}
                      onClick={() => onTimeClicked(item.hour, 0)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">
                        {formatHour(item.hour)}{" "}
                        <span className="text-muted-foreground text-xs">
                          (Click to change slot)
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
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
        <div className="text-center text-xs text-muted-foreground">
          Time (h)
        </div>
      </div>
    </TooltipProvider>
  );
}

import { useAppSelector } from "@/lib/hooks/redux";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { AIUsageType } from "@prisma/client";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function UsageDisplay() {
  const usages = useAppSelector(selectSettings);

  const usageTypeToDisplayName = {
    [AIUsageType.ideaGeneration]: "Idea Generation",
    [AIUsageType.textEnhancement]: "Text Enhancement",
    [AIUsageType.titleOrSubtitleRefinement]: "Title/Subtitle Refinement",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Remaining: {usages.credits.remaining}</span>
              <span>Total: {usages.credits.total}</span>
            </div>
            <Progress 
              value={(usages.credits.remaining / Math.max(usages.credits.total, 1)) * 100} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {usages.credits.used} credits used
            </p>
          </div>
        </CardContent>
      </Card>

      {Object.entries(usageTypeToDisplayName).map(([type, displayName]) => {
        const usageType = type as AIUsageType;
        const usage = usages[usageType.toLowerCase() as keyof typeof usages];
        
        if (!usage || typeof usage === 'object' && 'count' in usage) {
          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{displayName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used: {usage.count}</span>
                    <span>Cost: {usage.creditCost} credits per use</span>
                  </div>
                  <Progress
                    value={(usage.count / Math.max(usage.max, 1)) * 100}
                    className={`h-2 ${usage.didExceed ? "bg-red-500" : ""}`}
                  />
                  {usage.didExceed && (
                    <p className="text-xs text-red-500 mt-1">
                      Not enough credits for this operation
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })}
    </div>
  );
} 
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSettings } from "@/lib/hooks/useSettings";
import { Loader2, RefreshCw } from "lucide-react";

export default function CreditsDisplay() {
  const { credits } = useSettings();

  const percentRemaining =
    (credits.remaining / Math.max(credits.total, 1)) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Credits</span>
        </CardTitle>
        <CardDescription>
          Your available credits for AI operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {credits.remaining} credits remaining
            </span>
            <span className="text-muted-foreground">
              of {credits.total} total
            </span>
          </div>
          <Progress
            value={percentRemaining}
            className={`h-2 ${percentRemaining < 20 ? "bg-red-500" : ""}`}
          />
          <p className="text-xs text-muted-foreground">
            {credits.used} credits used in current period
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <div className="text-sm">
          <p className="font-medium">Credit Costs:</p>
          <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
            <li>Idea Generation: 3 credits</li>
            <li>Text Enhancement: 1 credit</li>
            <li>Title/Subtitle Refinement: 1 credit</li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  );
}

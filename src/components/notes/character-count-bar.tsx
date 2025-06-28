"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, EyeOff } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

interface CharacterCountBarProps {
  characterCount: number;
  className?: string;
}

const VIRAL_RANGES = [
  {
    range: { low: 120, high: 209 },
    score: 7,
    text: "Solid",
    color: "bg-orange-500",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  {
    range: { low: 210, high: 239 },
    score: 8,
    text: "Strong",
    color: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  {
    range: { low: 240, high: 280 },
    score: 9,
    text: "Perfect",
    color: "bg-green-500",
    textColor: "text-green-700 dark:text-green-300",
  },
];

export function CharacterCountBar({
  characterCount,
  className,
}: CharacterCountBarProps) {
  const [showCharacterCountBar, setShowCharacterCountBar] = useLocalStorage(
    "show_character_count_bar",
    true,
  );

  const currentRange = useMemo(() => {
    return VIRAL_RANGES.find(
      range =>
        characterCount >= range.range.low && characterCount <= range.range.high,
    );
  }, [characterCount]);

  const progressPercentage = useMemo(() => {
    if (characterCount <= 150) {
      return (characterCount / 150) * 100;
    }
    if (characterCount >= 280) {
      return 100;
    }
    // Calculate progress within the viral ranges (150-280)
    return ((characterCount - 150) / (280 - 150)) * 100;
  }, [characterCount]);

  const getBarColor = () => {
    if (currentRange) {
      return currentRange.color;
    }
    if (characterCount < 150) {
      return "bg-gray-400";
    }
    if (characterCount <= 330) {
      return "bg-emerald-500"; // Extended peak range 281-300
    }
    return "bg-emerald-400"; // Over 300
  };

  const getTextColor = () => {
    if (currentRange) {
      return currentRange.textColor;
    }
    if (characterCount < 150) {
      return "text-gray-600 dark:text-gray-400";
    }
    if (characterCount <= 330) {
      return "text-emerald-700 dark:text-emerald-300"; // Extended peak range 281-300
    }
    return "text-emerald-600 dark:text-emerald-400"; // Over 300
  };

  const getFeedbackText = () => {
    if (currentRange) {
      return currentRange.text;
    }
    if (characterCount < 150) {
      return "Short and punchy.";
    }
    if (characterCount <= 330) {
      return "Perfect."; // Extended peak range 281-300
    }
    // A text that doesn't tell the user that they're wrong, but doesn't give them a false sense of security
    return "";
  };

  const getScore = () => {
    if (currentRange) {
      return currentRange.score;
    }
    if (characterCount < 150) {
      return Math.max(1, Math.floor((characterCount / 150) * 5));
    }
    if (characterCount <= 330) {
      return 10; // Extended peak range 281-300
    }
    return Math.max(1, 10 - Math.floor((characterCount - 330) / 10));
  };

  return (
    <div className={cn("hidden md:flex items-center gap-2", className)}>
      {showCharacterCountBar && (
        <div className="flex flex-col gap-2">
          <div className="w-40 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                getBarColor(),
              )}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              {characterCount} chars
            </span>
            <p className={cn("text-xs leading-relaxed", getTextColor())}>
              {getFeedbackText()}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-end">
        <TooltipButton
          tooltipContent={
            showCharacterCountBar ? "Hide virality bar" : "Show virality bar"
          }
          variant="ghost"
          size="sm"
          onClick={() => setShowCharacterCountBar(!showCharacterCountBar)}
          className="h-6 w-6 p-0"
        >
          {showCharacterCountBar ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <BarChart3 className="h-3 w-3" />
          )}
        </TooltipButton>
      </div>
    </div>
  );
}

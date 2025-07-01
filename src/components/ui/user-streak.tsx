"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { FlameIcon } from "@/components/ui/flame-icon";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UserStreakProps {
  streak?: number;
  showText?: boolean;
  className?: string;
}

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function UserStreak({ className, showText = true }: UserStreakProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const { streakCount, loading, fetchStreakData } = useNotesStats();
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    
    if (!streakCount && streakCount !== 0) {
      fetchStreakData();
    }
  }, [streakCount, fetchStreakData]);

  // Load animation data on component mount
  useEffect(() => {
    const loadAnimationData = async () => {
      try {
        const response = await fetch("/icons/flame.json");
        if (!response.ok) {
          throw new Error("Failed to fetch animation data");
        }
        const dataText = await response.text();
        setAnimationData(JSON.parse(dataText));
      } catch (error) {
        console.error("Failed to load animation:", error);
      }
    };

    loadAnimationData();
  }, []);

  // Set animation speed when lottie instance is available
  useEffect(() => {
    if (lottieRef.current && isHovering) {
      lottieRef.current.setSpeed(0.6);
    }
  }, [isHovering]);

  const hasActiveStreak = streakCount > 0;

  return (
    <Button
      variant={"outline"}
      className={cn(
        "flex items-center gap-1",
        !showText && "px-0.5 border-none shadow-none hover:bg-transparent",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      asChild
    >
      <Link href="/statistics">
        {loading ? (
          <RefreshCcw
            className="animate-spin text-muted-foreground"
            size={16}
          />
        ) : (
          <>
            <div className="relative w-5 h-5">
              {isHovering && animationData && streakCount > 0 ? (
                <Lottie
                  lottieRef={lottieRef}
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <FlameIcon
                  className={cn({
                    "text-muted-foreground": !hasActiveStreak,
                    "text-muted-foreground/70": hasActiveStreak && !isHovering,
                    "text-primary": hasActiveStreak && isHovering,
                  })}
                  size={20}
                />
              )}
            </div>
            <span
              className={cn(
                "text-sm text-muted-foreground font-medium select-none",
                {
                  "text-primary": isHovering,
                },
              )}
            >
              {streakCount}
              {showText && (
                <span
                  className={cn("text-muted-foreground text-xs ml-1", {
                    "text-primary": isHovering,
                  })}
                >
                  {" "}
                  Notes Streak
                </span>
              )}
            </span>
          </>
        )}
      </Link>
    </Button>
  );
}

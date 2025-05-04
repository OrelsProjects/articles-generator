"use client";

import { useState, useRef, useEffect } from "react";
// import Lottie from "lottie-react";
import { cn } from "@/lib/utils";
import { FlameIcon } from "@/components/ui/flame-icon";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import { RefreshCcw } from "lucide-react";

interface UserStreakProps {
  streak?: number;
  showText?: boolean;
  className?: string;
}

export function UserStreak({ className, showText = true }: UserStreakProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const { streakCount, loading } = useNotesStats();
  const lottieRef = useRef<any>(null);

  console.log("streak loading", loading);

  // Load animation data on component mount
  useEffect(() => {
    const loadAnimationData = async () => {
      try {
        const response = await fetch("/icons/flame.json");
        const data = await response.json();
        setAnimationData(data);
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
    <div
      className={cn("flex items-center gap-1", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {loading ? (
        <RefreshCcw className="animate-spin text-muted-foreground" size={16} />
      ) : (
        <>
          <div className="relative w-5 h-5">
            {isHovering && animationData && streakCount > 0 ? (
              //   <Lottie
              //     lottieRef={lottieRef}
              //     animationData={animationData}
              //     loop={true}
              //     autoplay={true}
              //     style={{ width: "100%", height: "100%" }}
              //   />
              <></>
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
          <span className="text-sm font-medium select-none">
            {streakCount}
            {showText && (
              <span className="text-muted-foreground text-xs ml-1">
                {" "}
                notes streak
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}

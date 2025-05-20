import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownBannerProps {
  nextGenerateDate: Date;
  className?: string;
}

export function CountdownBanner({ nextGenerateDate, className }: CountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = nextGenerateDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ hours, minutes });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [nextGenerateDate]);

  if (timeLeft.hours === 0 && timeLeft.minutes === 0) {
    return null;
  }

  return (
    <div className={cn("w-full bg-primary/10 border border-primary/20 rounded-lg p-4 text-center", className)}>
      <p className="text-sm text-primary">
        You can generate your next note in{" "}
        <span className="font-semibold">
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </p>
    </div>
  );
} 
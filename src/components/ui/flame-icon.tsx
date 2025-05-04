"use client";

import { cn } from "@/lib/utils";

interface FlameIconProps {
  className?: string;
  strokeColor?: string;
  size?: number;
}

export function FlameIcon({ 
  className, 
  strokeColor = "currentColor", 
  size = 20 
}: FlameIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      fill="none" 
      viewBox="0 0 430 430"
      className={cn("text-muted-foreground transition-colors duration-200", className)}
    >
      <path 
        stroke={strokeColor} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="18" 
        d="M228.97 40c77.947 29.47 133.793 103.659 135.967 191.115C367.385 314.185 298.501 385 215.001 385 132.158 385 65 318.104 65 235.583c0-52.347 27.024-98.407 67.933-125.091-3.569 23.997.515 48.942 11.716 70.508 59.771-17.321 97.301-80.84 84.321-141"
      />
    </svg>
  );
} 
"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface StepItem {
  value: number | string;
  label: string;
}

interface StepSliderProps {
  items: StepItem[];
  value: number | string;
  onChange: (value: number | string) => void;
  className?: string;
}

export function StepSlider({
  items,
  value,
  onChange,
  className,
}: StepSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find current index based on value
  useEffect(() => {
    const index = items.findIndex(item => item.value === value);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [value, items]);

  const handleValueChange = (newValue: number[]) => {
    const index = newValue[0];
    setCurrentIndex(index);
    onChange(items[index].value);
  };

  return (
    <div className={cn("relative w-full px-4", className)}>
      {/* Min/Max Labels */}
      <div className="w-full flex gap-4 text-xs text-muted-foreground/80">
        <span>{items[0].label}</span>
        {/* Slider */}
        <Slider
          value={[currentIndex]}
          onValueChange={handleValueChange}
          max={items.length - 1}
          step={1}
          className="w-full"
          tooltipLabel={`${items[currentIndex].label} credits`}
        />

        <span>{items[items.length - 1].label}</span>
      </div>
    </div>
  );
}

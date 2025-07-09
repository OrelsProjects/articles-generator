"use client";

import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MAX_NOTES_COUNT, MIN_NOTES_COUNT } from "@/lib/consts";
import { AnimatePresence, motion } from "framer-motion";
import { AdvancedOptionContainer } from "@/components/notes/note-generator/advanced-option-container";

interface NoteCountSectionProps {
  enabled: boolean;
  value: number;
  defaultValue: number;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: number) => void;
}

export function NoteCountSection({
  enabled,
  value,
  onEnabledChange,
  onValueChange,
}: NoteCountSectionProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [thumbPosition, setThumbPosition] = useState<number>(0);

  const [didEnableChange, setDidEnableChange] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate credits based on note count
  const calculateCredits = (count: number) => {
    // Base credit cost for notes generation
    return count; // 1 credit per note
  };

  // Update thumb position when value changes
  useEffect(() => {
    if (sliderRef.current) {
      const sliderWidth = sliderRef.current.offsetWidth;
      const percentage =
        ((value - MIN_NOTES_COUNT) / (MAX_NOTES_COUNT - MIN_NOTES_COUNT)) * 100;
      const position = (percentage / 100) * sliderWidth;
      setThumbPosition(position);
    }
  }, [value]);

  const handleEnabledChange = (enabled: boolean) => {
    setDidEnableChange(true);
    onEnabledChange(enabled);
    setTimeout(() => {
      setDidEnableChange(false);
    }, 100);
  };

  return (
    <AdvancedOptionContainer
      enabled={enabled}
      onEnabledChange={handleEnabledChange}
      label="Number of notes to generate"
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">
          {value} notes will be generated
        </Label>
      </div>
      <div className="relative" ref={sliderRef}>
        <Popover open={showPopover}>
          <PopoverTrigger asChild>
            <div
              ref={popoverRef}
              className="absolute -top-4 pointer-events-none"
              style={{
                left: `${thumbPosition}px`,
                transform: "translateX(-50%)",
              }}
            />
          </PopoverTrigger>
          <PopoverContent
            hideCloseButton
            className="w-auto p-2 text-xs"
            side="top"
            align="center"
            sideOffset={5}
          >
            {calculateCredits(value)} credits
          </PopoverContent>
        </Popover>

        <Slider
          value={[value]}
          onValueChange={([val]) => onValueChange(val)}
          min={MIN_NOTES_COUNT}
          max={MAX_NOTES_COUNT}
          step={1}
          className={cn("w-full", !enabled && "opacity-50")}
          disabled={!enabled}
          onPointerDown={() => setShowPopover(true)}
          onPointerUp={() => setShowPopover(false)}
          onPointerLeave={() => setShowPopover(false)}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{MIN_NOTES_COUNT}</span>
        <span>{MAX_NOTES_COUNT}</span>
      </div>
    </AdvancedOptionContainer>
  );
}

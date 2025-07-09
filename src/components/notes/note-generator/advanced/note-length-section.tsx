"use client";

import { AdvancedOptionContainer } from "@/components/notes/note-generator/advanced-option-container";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MAX_NOTES_LENGTH, MIN_NOTES_LENGTH } from "@/lib/consts";
import { cn } from "@/lib/utils";

interface NoteLengthSectionProps {
  enabled: boolean;
  value: number | null;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (noteLength: number) => void;
}

export function NoteLengthSection({
  enabled,
  value,
  onEnabledChange,
  onValueChange,
}: NoteLengthSectionProps) {
  const handleEnabledChange = (enabled: boolean) => {
    onEnabledChange(enabled);
  };

  return (
    <AdvancedOptionContainer
      enabled={enabled}
      onEnabledChange={handleEnabledChange}
      label="Custom note length"
      className="space-y-3 pl-6"
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">
          Length: {value} characters
        </Label>
      </div>
      <Slider
        value={[value || MIN_NOTES_LENGTH]}
        onValueChange={val => onValueChange(val[0])}
        min={MIN_NOTES_LENGTH}
        max={MAX_NOTES_LENGTH}
        step={10}
        className={cn("w-full", !enabled && "opacity-50")}
        disabled={!enabled}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{MIN_NOTES_LENGTH}</span>
        <span>{MAX_NOTES_LENGTH}</span>
      </div>
    </AdvancedOptionContainer>
  );
}

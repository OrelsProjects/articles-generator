"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CircleArrowRight, Clock4, Save } from "lucide-react";
import { useQueue } from "@/lib/hooks/useQueue";
import { format } from "date-fns";
import { NoteDraft } from "@/types/note";
import { cn } from "@/lib/utils";
import { Logger } from "@/logger";
import useMediaQuery from "@/lib/hooks/useMediaQuery";

interface SaveDropdownProps {
  selectedNote?: NoteDraft | null;
  onSave: ({ closeOnSave }: { closeOnSave?: boolean }) => Promise<unknown>;
  onSchedule: () => unknown;
  onAddToQueue: (date: Date) => Promise<unknown>;
  presetSchedule?: Date;
  disabled?: boolean;
  confirmedSchedule?: boolean;
  saving?: boolean;
  isInspiration?: boolean;
  isAiGenerated?: boolean;
  isFree?: boolean;
}

export function SaveDropdown({
  onSave,
  onSchedule,
  onAddToQueue,
  presetSchedule,
  disabled = false,
  saving = false,
  isInspiration = false,
  isAiGenerated = false,
  isFree = false,
}: SaveDropdownProps) {
  const { getNextAvailableSchedule, loading: queueLoading } = useQueue();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [loading, setLoading] = useState(false);

  const nextAvailableSlotText = () => {
    if (saving) {
      return <span className="font-semibold">Saving...</span>;
    }
    const nextAvailableSlot = getNextAvailableSchedule(presetSchedule);
    let text = null;
    const date = nextAvailableSlot;

    if (date) {
      text = format(date, "MMM do, yyyy, HH:mm");
    }
    return (
      <div className={cn("flex flex-col")}>
        <span className="font-semibold">Add to Queue</span>
        <span className={cn("text-xs text-primary-foreground")}>{text}</span>
      </div>
    );
  };

  const handleAddToQueue = async (
    options: { forceNextDate?: boolean } = {},
  ) => {
    try {
      Logger.info("ADDING-SCHEDULE: handleAddToQueue", {
        options,
      });
      const nextAvailableSlot = getNextAvailableSchedule(presetSchedule);
      const nextAvailableSlotNoPreset = getNextAvailableSchedule();

      setLoading(true);
      const date = options.forceNextDate
        ? nextAvailableSlotNoPreset
        : nextAvailableSlot;
      if (date) {
        await onAddToQueue(date);
      } else {
        onSchedule();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isInspiration || isFree || isAiGenerated) {
    return (
      <Button
        variant="default"
        className="px-5 !py-2 flex items-center gap-1 "
        disabled={disabled || loading || queueLoading}
        onClick={() => {
          onSave({ closeOnSave: false });
        }}
      >
        {saving ? "Saving..." : isFree ? "Save" : "Save to drafts"}
      </Button>
    );
  }

  return (
    <div className="h-full flex">
      <Button
        variant="default"
        className="px-3 !py-2 flex items-center gap-1  rounded-r-md md:rounded-r-none"
        disabled={disabled || loading || queueLoading}
        onClick={() => {
          handleAddToQueue();
        }}
      >
        {isMobile ? "Save" : nextAvailableSlotText()}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            className="px-3 border-l rounded-l-none text-foreground hidden lg:flex"
            disabled={disabled || loading || queueLoading}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={onSchedule}
            disabled={disabled || loading}
            className="text-muted-foreground"
          >
            <Clock4 className="h-4 w-4 mr-2" />
            Schedule
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onSave({ closeOnSave: true })}
            disabled={disabled || loading}
            className="text-muted-foreground"
          >
            <Save className="h-4 w-4 mr-2" />
            Save and close
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

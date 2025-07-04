"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  DateRangeOption,
  DATE_RANGE_OPTIONS,
  DATE_RANGE_LABELS,
} from "@/lib/consts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangeSelectorProps {
  value: DateRangeOption;
  customDateRange: DateRange | null | undefined;
  onChange: (
    dateRange: DateRangeOption,
    customDateRange?: DateRange | null,
  ) => void;
  isLoading?: boolean;
}

export function DateRangeSelector({
  value,
  customDateRange,
  onChange,
  isLoading = false,
}: DateRangeSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | null | undefined>(customDateRange);
  const [previousSelection, setPreviousSelection] = useState<DateRangeOption>(value);

  const handleDateRangeChange = (newValue: DateRangeOption) => {
    if (newValue === DATE_RANGE_OPTIONS.CUSTOM) {
      // Store previous selection and open calendar for custom range selection
      setPreviousSelection(value);
      setTempDateRange(customDateRange);
      setIsCalendarOpen(true);
      return;
    }
    onChange(newValue);
  };

  const handleCustomDateRangeApply = () => {
    if (tempDateRange?.from) {
      onChange(DATE_RANGE_OPTIONS.CUSTOM, tempDateRange);
      setIsCalendarOpen(false);
    }
  };

  const handleCustomDateRangeCancel = () => {
    // Revert to previous selection if nothing was chosen
    setTempDateRange(customDateRange);
    setIsCalendarOpen(false);
    // Don't change the dropdown selection, it will stay as it was
  };

  const getDisplayText = () => {
    if (value === DATE_RANGE_OPTIONS.CUSTOM && customDateRange) {
      if (customDateRange.from && customDateRange.to) {
        return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`;
      }
      if (customDateRange.from) {
        return `${format(customDateRange.from, "MMM d")} - Today`;
      }
    }
    return DATE_RANGE_LABELS[value];
  };

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          <Select
            value={value}
            onValueChange={handleDateRangeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="h-4 w-4" />
              <span className="truncate">{getDisplayText()}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <CalendarComponent
            mode="range"
            selected={tempDateRange || undefined}
            onSelect={setTempDateRange}
            disabled={date => date > new Date()}
            initialFocus
          />

          <div className="flex gap-2">
            <Button
              onClick={handleCustomDateRangeApply}
              className="flex-1"
              disabled={isLoading || !tempDateRange?.from}
            >
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={handleCustomDateRangeCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

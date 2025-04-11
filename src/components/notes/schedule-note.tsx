"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CalendarClock } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { addHours } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMonthValue,
  getDayValue,
  getYearValue,
  getHourValue,
  getMinuteValue,
  getAmPmValue,
  generateDays,
  generateHours,
  generateMinutes,
  generateYears,
  getScheduleTimeText,
  months,
  updateMonth,
  updateDay,
  updateYear,
  updateHour,
  updateMinute,
  updateAmPm,
  isValidScheduleTime,
  getInvalidTimeMessage,
} from "@/lib/utils/date/schedule";
import { useExtension } from "@/lib/hooks/useExtension";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { useUi } from "@/lib/hooks/useUi";

interface ScheduleNoteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScheduledDate?: Date | null;
  onScheduleConfirm: (date: Date) => Promise<void>;
}

export function ScheduleNote({
  open,
  onOpenChange,
  initialScheduledDate,
  onScheduleConfirm,
}: ScheduleNoteProps) {
  const { showScheduleModal, updateShowScheduleModal } = useUi();

  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    initialScheduledDate ? new Date(initialScheduledDate) : undefined,
  );
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);

  const { hasExtension } = useExtension();

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  useEffect(() => {
    if (showScheduleModal) {
      handleOpenChange(true);
      updateShowScheduleModal(false);
    }
  }, [open]);

  // Set default time to one hour from now when opening the schedule dialog
  useEffect(() => {
    if (open && !scheduledDate) {
      const defaultDate = addHours(new Date(), 1);
      setScheduledDate(defaultDate);
    }
  }, [open, scheduledDate]);

  // Validate the schedule time whenever it changes
  useEffect(() => {
    if (scheduledDate) {
      setTimeError(
        isValidScheduleTime(scheduledDate) ? null : getInvalidTimeMessage(),
      );
    } else {
      setTimeError(null);
    }
  }, [scheduledDate]);

  // Update scheduled date when initialScheduledDate prop changes
  useEffect(() => {
    if (initialScheduledDate) {
      setScheduledDate(new Date(initialScheduledDate));
    }
  }, [initialScheduledDate]);

  const handleClearSchedule = () => {
    handleOpenChange(false);
    setTimeError(null);
  };

  // Handle confirming the schedule
  const handleConfirmSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const userHasExtension = await hasExtension();
      if (!userHasExtension) {
        setShowExtensionDialog(true);
        return;
      }
      if (scheduledDate && isValidScheduleTime(scheduledDate)) {
        await onScheduleConfirm(scheduledDate);
        handleOpenChange(false);
      } else {
        setTimeError(getInvalidTimeMessage());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Update a date field
  const handleDateUpdate = (type: "month" | "day" | "year", value: string) => {
    if (!scheduledDate) {
      const now = new Date();
      setScheduledDate(now);
      return;
    }

    let updatedDate: Date;

    switch (type) {
      case "month":
        updatedDate = updateMonth(scheduledDate, value);
        break;
      case "day":
        updatedDate = updateDay(scheduledDate, value);
        break;
      case "year":
        updatedDate = updateYear(scheduledDate, value);
        break;
      default:
        return;
    }

    setScheduledDate(updatedDate);
  };

  // Update a time field
  const handleTimeUpdate = (
    type: "hour" | "minute" | "ampm",
    value: string,
  ) => {
    if (!scheduledDate) {
      const now = new Date();
      setScheduledDate(now);
      return;
    }

    let updatedDate: Date;

    switch (type) {
      case "hour":
        updatedDate = updateHour(scheduledDate, value);
        break;
      case "minute":
        updatedDate = updateMinute(scheduledDate, value);
        break;
      case "ampm":
        updatedDate = updateAmPm(scheduledDate, value);
        break;
      default:
        return;
    }

    setScheduledDate(updatedDate);
  };

  // Render the scheduled time text with a CalendarClock icon
  const renderScheduleTimeText = () => {
    if (!scheduledDate) return null;

    return (
      <div className="flex items-center gap-2 text-base text-foreground">
        <CalendarClock className="h-5 w-5" />
        {getScheduleTimeText(scheduledDate)}
      </div>
    );
  };

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isTimeValid = !timeError;

  return (
    <div className="hidden md:flex">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          hideCloseButton
          className="max-w-[550px] p-0 gap-0 border-border bg-background rounded-xl"
        >
          <div className="p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-foreground">Schedule</h2>

            {scheduledDate && (
              <div className="py-2 px-4 bg-accent/30 rounded-md">
                {renderScheduleTimeText()}
              </div>
            )}

            {timeError && (
              <div className="py-2 px-4 bg-destructive/20 text-destructive rounded-md text-sm">
                {timeError}
              </div>
            )}

            <div className="space-y-8">
              <div className="space-y-2 bg-muted/10 p-4 py-2 rounded-md">
                <div className="text-muted-foreground text-lg font-medium">
                  {timezone}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Date</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    value={
                      scheduledDate ? getMonthValue(scheduledDate) : undefined
                    }
                    onValueChange={value => handleDateUpdate("month", value)}
                  >
                    <SelectTrigger className="h-11 bg-background border-border">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {months.map(month => (
                        <SelectItem
                          key={month}
                          value={month}
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={
                      scheduledDate ? getDayValue(scheduledDate) : undefined
                    }
                    onValueChange={value => handleDateUpdate("day", value)}
                  >
                    <SelectTrigger className="h-11 bg-background border-border">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {generateDays(scheduledDate).map(day => (
                        <SelectItem
                          key={day}
                          value={day}
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={
                      scheduledDate ? getYearValue(scheduledDate) : undefined
                    }
                    onValueChange={value => handleDateUpdate("year", value)}
                  >
                    <SelectTrigger className="h-11 bg-background border-border">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {generateYears().map(year => (
                        <SelectItem
                          key={year}
                          value={year}
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Time</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    value={
                      scheduledDate ? getHourValue(scheduledDate) : undefined
                    }
                    onValueChange={value => handleTimeUpdate("hour", value)}
                  >
                    <SelectTrigger className="h-11 bg-background border-border">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {generateHours().map(hour => (
                        <SelectItem
                          key={hour}
                          value={hour}
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={
                      scheduledDate ? getMinuteValue(scheduledDate) : undefined
                    }
                    onValueChange={value => handleTimeUpdate("minute", value)}
                  >
                    <SelectTrigger className="h-11 bg-background border-border">
                      <SelectValue placeholder="Minute" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border h-[200px]">
                      {generateMinutes().map(minute => (
                        <SelectItem
                          key={minute}
                          value={minute}
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={
                      scheduledDate ? getAmPmValue(scheduledDate) : undefined
                    }
                    onValueChange={value => handleTimeUpdate("ampm", value)}
                  >
                    <SelectTrigger className="h-11 bg-background border-border">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem
                        value="AM"
                        className="focus:bg-accent focus:text-accent-foreground"
                      >
                        AM
                      </SelectItem>
                      <SelectItem
                        value="PM"
                        className="focus:bg-accent focus:text-accent-foreground"
                      >
                        PM
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="w-full flex justify-end gap-3">
                <Button
                  variant="ghost"
                  className="hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={handleClearSchedule}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-full px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleConfirmSchedule}
                  disabled={!isTimeValid || loadingSchedule}
                >
                  {loadingSchedule ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExtensionInstallDialog
        open={showExtensionDialog}
        onOpenChange={setShowExtensionDialog}
        onInstall={() => {
          setShowExtensionDialog(false);
        }}
      />
    </div>
  );
}

export default ScheduleNote;

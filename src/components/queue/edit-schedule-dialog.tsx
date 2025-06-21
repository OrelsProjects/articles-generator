"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Plus,
  RefreshCw,
  ChevronDown,
  Save,
  Clock,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQueue } from "@/lib/hooks/useQueue";
import { toast } from "react-toastify";
import { useAppSelector } from "@/lib/hooks/redux";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduleExistsError } from "@/lib/errors/ScheduleExistsError";
import { FollowerActivityChart } from "@/components/analytics/follower-activity-chart";
import { useUi } from "@/lib/hooks/useUi";

interface ScheduleEntry {
  id: string;
  time: string;
  days: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
}

interface EditScheduleDialogProps {}

export function EditScheduleDialog({}: EditScheduleDialogProps) {
  const {
    addSchedule,
    removeSchedule,
    updateSchedule,
    loading,
    loadingBestTimeToPublish,
  } = useQueue();
  const { showCreateScheduleDialog, updateShowCreateScheduleDialog } = useUi();
  const { userSchedules } = useAppSelector(state => state.notes);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isAddingSlot, setIsAddingSlot] = useState(true);

  // Time picker state
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);

  const updateOpen = (open: boolean) => {
    updateShowCreateScheduleDialog(open);
  };

  // Convert userSchedules to ScheduleEntries format for the UI
  useEffect(() => {
    if (userSchedules && userSchedules.length > 0) {
      const formattedSchedule = userSchedules.map(userSchedule => {
        // Convert to 24-hour format
        let hour24 = userSchedule.hour;
        if (userSchedule.ampm === "pm" && hour24 < 12) hour24 += 12;
        if (userSchedule.ampm === "am" && hour24 === 12) hour24 = 0;

        // Format time string in 24-hour format
        const timeString = `${hour24.toString().padStart(2, "0")}:${userSchedule.minute.toString().padStart(2, "0")}`;

        // Map days
        const days = {
          mon: userSchedule.monday,
          tue: userSchedule.tuesday,
          wed: userSchedule.wednesday,
          thu: userSchedule.thursday,
          fri: userSchedule.friday,
          sat: userSchedule.saturday,
          sun: userSchedule.sunday,
        };

        return {
          id: userSchedule.id,
          time: timeString,
          days,
        };
      });
      setSchedule(formattedSchedule);
    } else if (schedule.length === 0) {
      // If no schedules exist, we don't add a default one anymore
      // The user will explicitly add new slots when needed
      setSchedule([]);
    }
  }, [userSchedules, schedule.length]);

  // Helper function to parse time string to hour and minute
  const parseTimeString = (timeString: string) => {
    const [hourStr, minuteStr] = timeString.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Convert to 12-hour format for API
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    const ampm = hour >= 12 ? ("pm" as const) : ("am" as const);

    return { hour: hour12, minute, ampm };
  };

  const handleToggleDay = async (
    entryId: string,
    day: keyof ScheduleEntry["days"],
  ) => {
    // Update local state first (optimistic update)
    const newSchedule = schedule.map(entry =>
      entry.id === entryId
        ? { ...entry, days: { ...entry.days, [day]: !entry.days[day] } }
        : entry,
    );
    setSchedule(newSchedule);

    // Find the updated entry
    const updatedEntry = newSchedule.find(e => e.id === entryId);
    if (!updatedEntry) return;

    try {
      // Convert to the format expected by the API
      const { hour, minute, ampm } = parseTimeString(updatedEntry.time);

      // This is an existing entry, so we need to update it
      await updateSchedule({
        id: updatedEntry.id,
        hour,
        minute,
        ampm,
        sunday: updatedEntry.days.sun,
        monday: updatedEntry.days.mon,
        tuesday: updatedEntry.days.tue,
        wednesday: updatedEntry.days.wed,
        thursday: updatedEntry.days.thu,
        friday: updatedEntry.days.fri,
        saturday: updatedEntry.days.sat,
      });
    } catch (error) {
      // Revert the optimistic update
      toast.error("Failed to update schedule");
      console.error(error);
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    try {
      // Call API first
      await removeSchedule(entryId);

      setSchedule(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      toast.error("Failed to delete schedule slot");
      console.error(error);
    }
  };

  const handleAddNewSlot = async () => {
    try {
      // Convert from 24-hour to 12-hour format for API
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;
      const ampm = hours >= 12 ? "pm" : "am";

      // Use the API with 12-hour format as expected
      await addSchedule({
        hour: hour12,
        minute: minutes,
        ampm: ampm as "am" | "pm",
        sunday: true,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
      });

      // Toast success - the component will update when Redux store updates
      toast.success("New schedule slot added");
    } catch (error) {
      if (error instanceof ScheduleExistsError) {
        toast.error("Schedule already exists in the queue");
      } else {
        toast.error("Failed to add new schedule slot");
      }
      console.error(error);
    }
  };

  const handleMakeNatural = async () => {
    // Create new schedule with random minute values
    const usedMinutes = new Set<number>();

    const newSchedule = schedule.map(entry => {
      // Parse the current time
      const [time, period] = entry.time.split(" ");
      const [hoursStr, minutesStr] = time.split(":");
      const hours = parseInt(hoursStr);
      const currentMinutes = parseInt(minutesStr);

      // Try to find a unique minute value that's not divisible by 5
      let newMinutes = currentMinutes;
      let attempts = 0;

      while (attempts < 20) {
        // Generate random adjustment between -5 and +5 (excluding 0)
        const adjustment = Math.floor(Math.random() * 10) - 5;
        if (adjustment === 0) continue;

        // Apply adjustment
        newMinutes = currentMinutes + adjustment;

        // Handle edge cases: wrap around if needed
        if (newMinutes < 0) newMinutes += 60;
        if (newMinutes >= 60) newMinutes -= 60;

        // Check if valid: not divisible by 5 and not used yet
        if (newMinutes % 5 !== 0 && !usedMinutes.has(newMinutes)) {
          usedMinutes.add(newMinutes);
          break;
        }

        attempts++;
      }

      // If we couldn't find a valid adjustment, try harder
      if (newMinutes % 5 === 0 || usedMinutes.has(newMinutes)) {
        for (let i = 1; i < 60; i++) {
          const candidate = (currentMinutes + i) % 60;
          if (candidate % 5 !== 0 && !usedMinutes.has(candidate)) {
            newMinutes = candidate;
            usedMinutes.add(candidate);
            break;
          }
        }
      }

      // Create the new time string
      const newTime = `${hours}:${newMinutes.toString().padStart(2, "0")}`;
      return { ...entry, time: newTime };
    });

    // Update local state first (optimistic update)
    setSchedule(newSchedule);

    // Update all entries in the API
    try {
      const updatePromises = newSchedule.map(entry => {
        if (!entry.id.startsWith("temp-")) {
          const { hour, minute, ampm } = parseTimeString(entry.time);

          return updateSchedule({
            id: entry.id,
            hour,
            minute,
            ampm,
            sunday: entry.days.sun,
            monday: entry.days.mon,
            tuesday: entry.days.tue,
            wednesday: entry.days.wed,
            thursday: entry.days.thu,
            friday: entry.days.fri,
            saturday: entry.days.sat,
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      toast.success("Updated schedule with natural timing");
    } catch (error) {
      toast.error("Failed to update schedule");
      console.error(error);
    }
  };

  return (
    <Dialog open={showCreateScheduleDialog} onOpenChange={updateOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-screen md:max-h-[90%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            Edit your posting schedule
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto ">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-zinc-400">
                <th className="pb-2 pl-2 pr-4">TIME</th>
                <th className="pb-2 px-4 text-center">MON</th>
                <th className="pb-2 px-4 text-center">TUE</th>
                <th className="pb-2 px-4 text-center">WED</th>
                <th className="pb-2 px-4 text-center">THU</th>
                <th className="pb-2 px-4 text-center">FRI</th>
                <th className="pb-2 px-4 text-center">SAT</th>
                <th className="pb-2 px-4 text-center">SUN</th>
              </tr>
            </thead>
            <tbody>
              {[...schedule]
                .sort((a, b) => {
                  // Parse times to compare
                  const timeA = parseTimeString(a.time);
                  const timeB = parseTimeString(b.time);

                  // Convert to minutes since midnight for comparison
                  const minutesA = timeA.hour * 60 + timeA.minute;
                  const minutesB = timeB.hour * 60 + timeB.minute;

                  return minutesA - minutesB;
                })
                .map(entry => (
                  <tr key={entry.id} className="border-t border-zinc-700">
                    <td className="py-3 pl-2 pr-4 flex items-center">
                      <span className="mr-2">{entry.time}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        onClick={() => handleRemoveEntry(entry.id)}
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={entry.days.mon}
                        onCheckedChange={() => handleToggleDay(entry.id, "mon")}
                        disabled={loading}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={entry.days.tue}
                        onCheckedChange={() => handleToggleDay(entry.id, "tue")}
                        disabled={loading}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={entry.days.wed}
                        onCheckedChange={() => handleToggleDay(entry.id, "wed")}
                        disabled={loading}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={entry.days.thu}
                        onCheckedChange={() => handleToggleDay(entry.id, "thu")}
                        disabled={loading}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={entry.days.fri}
                        onCheckedChange={() => handleToggleDay(entry.id, "fri")}
                        disabled={loading}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={entry.days.sat}
                        onCheckedChange={() => handleToggleDay(entry.id, "sat")}
                        disabled={loading}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={entry.days.sun}
                        onCheckedChange={() => handleToggleDay(entry.id, "sun")}
                        disabled={loading}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center gap-4 pt-2">
          <Button
            variant="link"
            className="text-foreground"
            onClick={handleMakeNatural}
            disabled={loading || schedule.length === 0}
          >
            Make my schedule more natural
          </Button>

          <Collapsible
            open={isAddingSlot}
            onOpenChange={setIsAddingSlot}
            className="w-full flex flex-col items-center"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add a new slot
                {isAddingSlot ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <AnimatePresence>
              {isAddingSlot && (
                <CollapsibleContent forceMount asChild>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full mt-4 flex flex-col items-center gap-6 overflow-y-hidden"
                  >
                    {/* Modern Time Picker */}
                    <motion.div
                      className="bg-card/60 border border-border rounded-lg p-6 shadow-lg w-full max-w-[280px]"
                      initial={{ y: -20 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex justify-center mb-4">
                        <div className="text-xl font-semibold flex items-center text-center">
                          <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                          {hours.toString().padStart(2, "0")}:
                          {minutes.toString().padStart(2, "0")}
                        </div>
                      </div>

                      <div className="flex justify-center space-x-4">
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setHours(prev => (prev === 23 ? 0 : prev + 1))
                            }
                            className="rounded-full hover:bg-muted"
                          >
                            <ChevronUp className="h-5 w-5" />
                          </Button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={hours.toString().padStart(2, "0")}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value === "") {
                                setHours(0); // Default to 0 if empty
                                return;
                              }
                              const numValue = parseInt(value, 10);
                              if (numValue >= 0 && numValue <= 23) {
                                setHours(numValue);
                              } else if (numValue > 23) {
                                setHours(23); // Cap at 23
                              }
                            }}
                            className="text-2xl font-bold my-2 w-12 text-center bg-transparent !border !border-border/80 focus-visible:outline-none rounded-md p-1"
                            aria-label="Hours"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setHours(prev => (prev === 0 ? 23 : prev - 1))
                            }
                            className="rounded-full hover:bg-muted"
                          >
                            <ChevronDown className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="text-2xl font-bold flex items-center">
                          :
                        </div>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setMinutes(prev => (prev === 59 ? 0 : prev + 1))
                            }
                            className="rounded-full hover:bg-muted"
                          >
                            <ChevronUp className="h-5 w-5" />
                          </Button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={minutes.toString().padStart(2, "0")}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value === "") {
                                setMinutes(0); // Default to 0 if empty
                                return;
                              }
                              const numValue = parseInt(value, 10);
                              if (numValue >= 0 && numValue <= 59) {
                                setMinutes(numValue);
                              } else if (numValue > 59) {
                                setMinutes(59); // Cap at 59
                              }
                            }}
                            className="text-2xl font-bold my-2 w-12 text-center bg-transparent !border !border-border/80 focus-visible:outline-none rounded-md p-1"
                            aria-label="Minutes"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setMinutes(prev => (prev === 0 ? 59 : prev - 1))
                            }
                            className="rounded-full hover:bg-muted"
                          >
                            <ChevronDown className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        onClick={handleAddNewSlot}
                        disabled={loading}
                        className="px-5 py-2"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Slot
                      </Button>
                    </motion.div>
                  </motion.div>
                </CollapsibleContent>
              )}
            </AnimatePresence>
          </Collapsible>
        </div>

        {/* Follower Activity Chart */}
        <div className="mt-8 border-t border-border pt-4">
          {loadingBestTimeToPublish ? (
            <div className="flex justify-center items-center h-[200px]">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FollowerActivityChart />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

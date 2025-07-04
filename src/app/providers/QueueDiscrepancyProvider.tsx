"use client";

import { Dialog } from "@/components/ui/dialog";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import useMediaQuery from "@/lib/hooks/useMediaQuery";
import { useNotes } from "@/lib/hooks/useNotes";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { useQueue } from "@/lib/hooks/useQueue";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { Logger } from "@/logger";
import { GetSchedulesResponse } from "@/types/useExtension.type";
import { TriangleAlertIcon } from "lucide-react";
import { Discrepancy } from "@/types/schedule";
import { setSchedulesDiscrepancies } from "@/lib/features/notes/notesSlice";
import { AnimatePresence, motion } from "framer-motion";

export default function QueueDiscrepancyProvider() {
  const dispatch = useAppDispatch();
  const { schedulesDiscrepancies } = useAppSelector(state => state.notes);
  const [lastDismissed, setLastDismissed] = useLocalStorage<string | null>(
    "last_dismissed_discrepancy_bar",
    null,
  );
  const [didResetSchedules, setDidResetSchedules] = useLocalStorage(
    "did_reset_schedules",
    false,
  );
  const { user } = useAppSelector(state => state.auth);
  const { deleteSchedule, getSchedulesFromExtension } = useNotesSchedule();
  const { scheduleNote } = useNotes();
  const { scheduledNotes, draftNotes, publishedNotes } = useQueue();
  const isScheduled = useRef(false);
  const [shouldReschedule, setShouldReschedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setNotesRescheduled] = useState(0);
  const [, setTimesTriedToFix] = useState(0);

  const [isCheckingDiscrepancies, setIsCheckingDiscrepancies] = useState(false);
  const [showDiscrepancyBar, setShowDiscrepancyBar] = useState(false);
  const [currentIndexFixing, setCurrentIndexFixing] = useState(0);

  // if not chrome or not mobile  , return null
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isChrome = () => {
    return (
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    );
  };

  const updateSetShowDiscrepancyBar = (shouldShow?: boolean) => {
    if (shouldShow !== undefined) {
      setShowDiscrepancyBar(shouldShow);
      return;
    }
    if (schedulesDiscrepancies.length > 0) {
      const missed = schedulesDiscrepancies.filter(
        discrepancy => discrepancy.type === "missed",
      );
      if (missed.length === schedulesDiscrepancies.length) {
        // Don't show the discrepancy bar if all notes were missed
        setShowDiscrepancyBar(false);
        return;
      }
      setShowDiscrepancyBar(true);
      Logger.info("SCHEDULE DISCREPANCIES FOR USER", {
        schedulesDiscrepancies,
        user,
      });
    } else {
      setShowDiscrepancyBar(false);
    }
  };

  // Show the discrepancy bar when there are discrepancies
  useEffect(() => {
    updateSetShowDiscrepancyBar();
  }, [schedulesDiscrepancies]);

  const checkForDiscrepanciesTimeout = (delay: number = 2000) => {
    const timeout = setTimeout(() => {
      getSchedulesFromExtension()
        .then(schedules => {
          checkForDiscrepancies(schedules);
        })
        .catch(error => {
          Logger.error("Error getting schedules from extension", error);
        });
    }, delay);
    return timeout;
  };

  useEffect(() => {
    if (scheduledNotes.length === 0) return;
    // Timeout, to let the system settle
    const timeout = checkForDiscrepanciesTimeout(2000);
    return () => clearTimeout(timeout);
  }, [scheduledNotes]);

  /**
   * Checks for discrepancies between scheduled notes and extension schedules/alarms
   * @param schedulesFromExtension The schedules from the extension
   */
  const checkForDiscrepancies = (
    schedulesFromExtension: GetSchedulesResponse,
  ) => {
    if (!scheduledNotes.length) {
      return;
    }
    if (
      !schedulesFromExtension.schedules.length ||
      !schedulesFromExtension.alarms.length
    ) {
      // set discrapancy to to all scheduled notes
      dispatch(
        setSchedulesDiscrepancies(
          scheduledNotes.map(note => ({
            type: "missing_schedule",
            noteId: note.id,
            details: note.scheduledTo
              ? `Note "${note.body?.substring(0, 30)}..." is scheduled for ${new Date(note.scheduledTo).toLocaleString()} but has no schedule`
              : `Note "${note.body?.substring(0, 30)}..." is scheduled but has no schedule`,

            note,
          })),
        ),
      );
    }
    setIsCheckingDiscrepancies(true);
    const newDiscrepancies: Discrepancy[] = [];

    // Check

    // Check for notes that have scheduledTo but no corresponding schedule
    scheduledNotes.forEach(note => {
      if (!note.scheduledTo) return;

      const noteTimestamp = new Date(note.scheduledTo).getTime();

      // Check for schedules/alarms that don't have a corresponding note
      schedulesFromExtension.schedules.forEach(scheduleEntry => {
        const scheduleTime = scheduleEntry.timestamp;

        // Find a note with matching timestamp
        const matchingNote = scheduledNotes.find(
          note =>
            note.scheduledTo &&
            Math.abs(new Date(note.scheduledTo).getTime() - scheduleTime) <
              60000,
        );

        if (!matchingNote) {
          newDiscrepancies.push({
            type: "missing_note",
            scheduleId: scheduleEntry.scheduleId,
            details: `Schedule exists for time ${new Date(scheduleTime).toLocaleString()} but no note is scheduled for this time`,
          });
        }
      });

      // If note is in the past, add a missed note
      if (noteTimestamp < Date.now()) {
        newDiscrepancies.push({
          type: "missed",
          noteId: note.id,
          details: `Note "${note.body?.substring(0, 30)}..." was scheduled for ${new Date(note.scheduledTo).toLocaleString()} but was missed`,
          note,
        });
      }

      // Find schedule that matches this note's timestamp
      const matchingScheduleEntry = schedulesFromExtension.schedules.find(
        s => Math.abs(s.timestamp - noteTimestamp) < 60000,
      );

      if (!matchingScheduleEntry) {
        newDiscrepancies.push({
          type: "missing_schedule",
          noteId: note.id,
          details: `Note "${note.body?.substring(0, 30)}..." is scheduled for ${new Date(note.scheduledTo).toLocaleString()} but has no schedule`,
          note,
        });
        return;
      }

      // Check if there's an alarm for this schedule
      const matchingAlarm = schedulesFromExtension.alarms.find(
        alarm => Math.abs(alarm.scheduledTime - noteTimestamp) < 60000,
      );

      if (!matchingAlarm) {
        newDiscrepancies.push({
          type: "missing_alarm",
          noteId: note.id,
          details: `Note "${note.body?.substring(0, 30)}..." has a schedule but no alarm`,
          note,
        });
      }
    });

    // Check for any orphaned alarms (alarms with no matching schedule)
    schedulesFromExtension.alarms.forEach(alarm => {
      const alarmTime = alarm.scheduledTime;

      // Check if this alarm has a matching schedule
      const matchingSchedule = schedulesFromExtension.schedules.find(
        s => Math.abs(s.timestamp - alarmTime) < 60000,
      );

      if (!matchingSchedule) {
        // This is an orphaned alarm
        newDiscrepancies.push({
          type: "time_mismatch",
          details: `Alarm exists for time ${new Date(alarmTime).toLocaleString()} but has no matching schedule`,
        });
      }
    });

    const validDiscrepancies = newDiscrepancies.filter(
      discrepancy => discrepancy.noteId,
    );
    const uniqueDiscrepancies = validDiscrepancies.filter(
      (discrepancy, index, self) => {
        // Find all discrepancies with the same noteId
        const sameNoteDiscrepancies = self.filter(
          d => d.noteId === discrepancy.noteId,
        );

        // If there's only one, keep it
        if (sameNoteDiscrepancies.length === 1) {
          return true;
        }
        // If there are multiple, check if any is "missed"
        const missedDiscrepancy = sameNoteDiscrepancies.find(
          d => d.type === "missing_note",
        );

        if (missedDiscrepancy) {
          // Keep only the "missed" discrepancy
          return discrepancy.type === "missing_note";
        } else {
          // No "missed" type, keep the first occurrence
          return index === self.findIndex(t => t.noteId === discrepancy.noteId);
        }
      },
    );

    dispatch(setSchedulesDiscrepancies(uniqueDiscrepancies));
    console.log("newDiscrepancies", newDiscrepancies);
    setIsCheckingDiscrepancies(false);

    // Log the results
    if (newDiscrepancies.length > 0) {
      Logger.info(`Found ${newDiscrepancies.length} schedule discrepancies`, {
        discrepancies: newDiscrepancies,
      });
      setShowDiscrepancyBar(true);
    } else {
      Logger.info("No schedule discrepancies found");
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setLastDismissed(new Date().toISOString());
      setDidResetSchedules(true);
      setShowDiscrepancyBar(false);
    }
  };

  /**
   * Fix all discrepancies by rescheduling notes or removing orphaned schedules
   */
  const fixAllDiscrepancies = async () => {
    setLoading(true);
    try {
      for (const discrepancy of schedulesDiscrepancies) {
        switch (discrepancy.type) {
          case "missing_schedule":
          case "missing_alarm":
          case "time_mismatch":
            if (discrepancy.note && discrepancy.note.scheduledTo) {
              // If there's an existing schedule, delete it first
              if (discrepancy.scheduleId) {
                Logger.info(
                  "[FIX-ALL-DISCREPANCIES] Deleting schedule for note: " +
                    discrepancy.note.id,
                );
                await deleteSchedule(discrepancy.note.id);
              }
              // Reschedule the note
              await scheduleNote(
                discrepancy.note,
                new Date(discrepancy.note.scheduledTo),
              );
            }
            break;

          case "missing_note":
            if (discrepancy.schedule) {
              if (discrepancy.noteId) {
                Logger.info(
                  "[FIX-ALL-DISCREPANCIES] Deleting schedule for note: " +
                    discrepancy.noteId,
                );
                await deleteSchedule(discrepancy.noteId);
              }
            }
            break;
        }
        setCurrentIndexFixing(prev => prev + 1);
      }

      // Refresh schedules and check again
      const updatedSchedules = await getSchedulesFromExtension();
      checkForDiscrepancies(updatedSchedules);
      setTimesTriedToFix(prev => prev + 1);
      handleCloseDialog(false);
      Logger.info(`Fixed ${currentIndexFixing} schedule discrepancies`);
    } catch (error: any) {
      Logger.error("Error fixing schedule discrepancies", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didResetSchedules) return;
    if (scheduledNotes.length === 0) return;
    if (!isChrome() || isMobile) return;
    // if notes were loaded but no scheduled notes, set DidResetSchedules to true
    if (
      scheduledNotes.length === 0 &&
      (draftNotes.length > 0 || publishedNotes.length > 0)
    ) {
      setDidResetSchedules(true);
      return;
    }
  }, [didResetSchedules, scheduledNotes, draftNotes, publishedNotes]);

  const scheduleNotes = async () => {
    for (const note of scheduledNotes) {
      setNotesRescheduled(prev => prev + 1);
      if (!note.scheduledTo) continue;
      Logger.info("deleting schedule", {
        noteId: note.id,
      });
      await deleteSchedule(note.id);
      Logger.info("scheduling note", {
        noteId: note.id,
      });
      await scheduleNote(note, note.scheduledTo);
      Logger.info("scheduled note", {
        noteId: note.id,
      });
    }
  };

  useEffect(() => {
    if (!shouldReschedule) return;
    if (didResetSchedules) return;
    if (isScheduled.current) return;
    isScheduled.current = true;
    Logger.info("scheduling notes");

    setLoading(true);
    scheduleNotes()
      .then(() => {
        setDidResetSchedules(true);
        // Check for discrepancies after rescheduling
        return getSchedulesFromExtension();
      })
      .then(updatedSchedules => {
        checkForDiscrepancies(updatedSchedules);
      })
      .finally(() => {
        Logger.info("finished scheduling notes");
        isScheduled.current = false;
        setLoading(false);
      });
  }, [shouldReschedule]);

  const shouldShowDiscrepancyBar = useMemo(() => {
    // If last dismissed more than 10 minutes ago, and showDiscrepancyBar is true, return true
    if (
      lastDismissed &&
      new Date().getTime() - new Date(lastDismissed).getTime() > 10 * 60 * 1000
    ) {
      return showDiscrepancyBar;
    }
    return false;
  }, [lastDismissed, showDiscrepancyBar]);

  // Show only the discrepancy bar if dialog is not showing
  return (
    <AnimatePresence>
      {shouldShowDiscrepancyBar ? (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 bg-amber-500 text-black shadow-md animate-in fade-in slide-in-from-top duration-300 z-[51]"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="container mx-auto py-2 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TriangleAlertIcon className="w-4 h-4" />
              <span className="font-medium">
                Found {schedulesDiscrepancies.length} scheduling discrepancies{" "}
                <span className="text-sm text-black/80">
                  (Schedules without an alarm in the extension)
                </span>
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCloseDialog(false)}
                className="text-xs"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={fixAllDiscrepancies}
                disabled={loading || isCheckingDiscrepancies}
              >
                {loading
                  ? "Fixing..." +
                    currentIndexFixing +
                    "/" +
                    schedulesDiscrepancies.length
                  : "Fix Discrepancies"}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

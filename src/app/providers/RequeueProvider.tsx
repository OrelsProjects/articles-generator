"use client";

import {
  Dialog,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import useMediaQuery from "@/lib/hooks/useMediaQuery";
import { useNotes } from "@/lib/hooks/useNotes";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { useQueue } from "@/lib/hooks/useQueue";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { Logger } from "@/logger";
import { GetSchedulesResponse } from "@/types/useExtension.type";
import { TriangleAlertIcon } from "lucide-react";
import { Discrepancy } from "@/types/schedule";
import { setSchedulesDiscrepancies } from "@/lib/features/notes/notesSlice";
export default function RequeueProvider() {
  const dispatch = useAppDispatch();
  const { schedulesDiscrepancies } = useAppSelector(state => state.notes);
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
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notesRescheduled, setNotesRescheduled] = useState(0);
  // const [schedules, setSchedules] = useState<GetSchedulesResponse>({
  //   schedules: [],
  //   alarms: [],
  // });
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
      // setShowDiscrepancyBar(true);
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

  useEffect(() => {
    if (scheduledNotes.length === 0) return;
    getSchedulesFromExtension()
      .then(schedules => {
        checkForDiscrepancies(schedules);
      })
      .catch(error => {
        // Do nothing
      });
  }, [scheduledNotes]);

  /**
   * Checks for discrepancies between scheduled notes and extension schedules/alarms
   * @param currentSchedules The schedules from the extension
   */
  const checkForDiscrepancies = (currentSchedules: GetSchedulesResponse) => {
    if (
      !scheduledNotes.length &&
      !currentSchedules.schedules.length &&
      !currentSchedules.alarms.length
    )
      return;

    setIsCheckingDiscrepancies(true);
    const newDiscrepancies: Discrepancy[] = [];

    // Check for notes that have scheduledTo but no corresponding schedule
    scheduledNotes.forEach(note => {
      if (!note.scheduledTo) return;

      const noteTimestamp = new Date(note.scheduledTo).getTime();

      // Find schedule that matches this note's timestamp
      const matchingScheduleEntry = currentSchedules.schedules.find(
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
      const matchingAlarm = currentSchedules.alarms.find(
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

    // Check for schedules/alarms that don't have a corresponding note
    currentSchedules.schedules.forEach(scheduleEntry => {
      const scheduleTime = scheduleEntry.timestamp;

      // Find a note with matching timestamp
      const matchingNote = scheduledNotes.find(
        note =>
          note.scheduledTo &&
          Math.abs(new Date(note.scheduledTo).getTime() - scheduleTime) < 60000,
      );

      if (!matchingNote) {
        newDiscrepancies.push({
          type: "missing_note",
          scheduleId: scheduleEntry.scheduleId,
          details: `Schedule exists for time ${new Date(scheduleTime).toLocaleString()} but no note is scheduled for this time`,
        });
      }
    });

    // Check for any orphaned alarms (alarms with no matching schedule)
    currentSchedules.alarms.forEach(alarm => {
      const alarmTime = alarm.scheduledTime;

      // Check if this alarm has a matching schedule
      const matchingSchedule = currentSchedules.schedules.find(
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
      (discrepancy, index, self) =>
        index === self.findIndex(t => t.noteId === discrepancy.noteId),
    );

    dispatch(setSchedulesDiscrepancies(uniqueDiscrepancies));
    console.log("newDiscrepancies", newDiscrepancies);
    setIsCheckingDiscrepancies(false);

    // Log the results
    if (newDiscrepancies.length > 0) {
      Logger.info(`Found ${newDiscrepancies.length} schedule discrepancies`, {
        discrepancies: newDiscrepancies,
      });
    } else {
      Logger.info("No schedule discrepancies found");
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
    setShowDialog(true);
  }, [didResetSchedules, scheduledNotes, draftNotes, publishedNotes]);

  useEffect(() => {
    if (!shouldReschedule) return;
    if (didResetSchedules) return;
    if (isScheduled.current) return;
    isScheduled.current = true;
    Logger.info("scheduling notes");
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
    setLoading(true);
    scheduleNotes()
      .then(() => {
        setDidResetSchedules(true);
        setShowDialog(false);
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

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setShowDialog(false);
      setDidResetSchedules(true);
    }
  };

  //   Write a dialog that will show, if the didResetSchedules is false, and the user has not dismissed it.
  // Tell the user that there's a new system for scheduling notes. use @page-queue.tsx as a reference to see the dialog
  if (!showDialog) {
    // Show only the discrepancy bar if dialog is not showing
    return showDiscrepancyBar ? (
      <div
        className="fixed top-0 left-0 right-0 bg-amber-500 dark:bg-amber-600 text-black dark:text-white z-50 shadow-md animate-in fade-in slide-in-from-top duration-300"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="container mx-auto py-2 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TriangleAlertIcon className="w-4 h-4" />
            <span className="font-medium">
              Found {schedulesDiscrepancies.length} scheduling discrepancies
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateSetShowDiscrepancyBar(false)}
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
      </div>
    ) : null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
      {/* Render the discrepancy bar above the dialog when both should be visible */}
      {showDiscrepancyBar && (
        <div
          className="fixed top-0 left-0 right-0 bg-amber-300 dark:bg-amber-600 text-black dark:text-white z-50 shadow-md animate-in fade-in slide-in-from-top duration-300"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="container mx-auto py-2 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TriangleAlertIcon className="w-4 h-4" />
              <span className="font-medium">
                Found {schedulesDiscrepancies.length} scheduling discrepancies
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateSetShowDiscrepancyBar(false)}
                className="text-xs"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={fixAllDiscrepancies}
                disabled={loading || isCheckingDiscrepancies}
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-xs"
              >
                {loading ? "Fixing..." : "Fix Discrepancies"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <DialogContent closeOnOutsideClick={false}>
        <DialogHeader>
          <DialogTitle>New Scheduling System</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm">
          {/* Explain that the system is based on the Chrome extension and requires the user to have either a substack.com/writestack.io tab open to have the notes scheduled. */}
          <p>
            The new scheduling system is based on the Chrome extension and will
            require you to have either a substack.com or writestack.io tab open
            to have the notes sent on time.
          </p>
          <br />
          <p>
            <strong>
              You can auto reschedule your notes by clicking the Reschedule
              button below{" "}
            </strong>{" "}
            (It will have the correct date by default).
          </p>

          {schedulesDiscrepancies.length > 0 && (
            <>
              <br />
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Found {schedulesDiscrepancies.length} scheduling discrepancies
                that need attention.
              </p>
            </>
          )}

          {user?.displayName?.includes("anton") && (
            <>
              <br />
              <p className="text-base">
                <strong>Anton, you too.</strong>
              </p>
            </>
          )}
          <DialogFooter>
            <div className="w-full flex justify-end mt-4 gap-2">
              {schedulesDiscrepancies.length > 0 && (
                <Button
                  variant="outline"
                  disabled={loading || isCheckingDiscrepancies}
                  onClick={fixAllDiscrepancies}
                >
                  {loading ? "Fixing..." : "Fix Discrepancies"}
                </Button>
              )}
              <Button
                disabled={loading || isCheckingDiscrepancies}
                onClick={() => {
                  setShouldReschedule(true);
                }}
              >
                {loading
                  ? `Rescheduling... ${notesRescheduled}/${scheduledNotes.length}`
                  : "Reschedule notes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

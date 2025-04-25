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
import { useAppSelector } from "@/lib/hooks/redux";

export default function RequeueProvider() {
  const [didResetSchedules, setDidResetSchedules] = useLocalStorage(
    "did_reset_schedules",
    false,
  );
  const { user } = useAppSelector(state => state.auth);
  const { deleteSchedule } = useNotesSchedule();
  const { scheduleNote } = useNotes();
  const { scheduledNotes, draftNotes, publishedNotes } = useQueue();
  const isScheduled = useRef(false);
  const [shouldReschedule, setShouldReschedule] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notesRescheduled, setNotesRescheduled] = useState(0);

  // if not chrome or not mobile  , return null
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isChrome = () => {
    return (
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    );
  };

  useEffect(() => {
    if (didResetSchedules) return;
    if (scheduledNotes.length === 0) return;
    if (!isChrome() || isMobile) return;
    debugger;
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
    console.log("scheduling notes");
    const scheduleNotes = async () => {
      for (const note of scheduledNotes) {
        setNotesRescheduled(prev => prev + 1);
        if (!note.scheduledTo) continue;
        console.log("deleting schedule", note.id);
        await deleteSchedule(note.id);
        console.log("scheduling note", note.id);
        await scheduleNote(note, note.scheduledTo);
        console.log("scheduled note", note.id);
      }
    };
    setLoading(true);
    scheduleNotes()
      .then(() => {
        setDidResetSchedules(true);
        setShowDialog(false);
      })
      .finally(() => {
        console.log("finished scheduling notes");
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
  if (!showDialog) return null;
  return (
    <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
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
          {!user?.displayName?.includes("anton") && (
            <>
              <br />
              <p className="text-base">
                <strong>Anton, you too.</strong>
              </p>
            </>
          )}
          <DialogFooter>
            <div className="w-full flex justify-end mt-4">
              <Button
                disabled={loading}
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

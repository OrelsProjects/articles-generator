"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { selectNotes } from "@/lib/features/notes/notesSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
/**
 * This dialog is meant to explain the user how to use the notes schedule feature.
 * Instructions:
 * After scheduling a note, your note will be scheduled via the Chrome extension.
 * In order for the note to be posted, your Chrome must remain open.
 * If in the time of the scheduled post your Chrome is closed, the note will not be posted.
 *
 * You can also see the schedules by clicking the extension icon in the top right corner of your browser.
 * (show image /extension-click.png)
 */
export function ScheduleInstructionsDialog() {
  const { userNotes } = useAppSelector(selectNotes);
  const [didShowScheduleInstructions, setDidShowScheduleInstructions] =
    useLocalStorage("did_show_schedule_instructions", false);

  const [openDialog, setOpenDialog] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDidShowScheduleInstructions(true);
    }
    setOpenDialog(open);
  };

  useEffect(() => {
    const scheduledNotes = userNotes.filter(
      note => note.status === "scheduled",
    );
    if (scheduledNotes.length > 0) {
      setOpenDialog(true);
    }
  }, [userNotes]);

  if (didShowScheduleInstructions) {
    return null;
  }

  return (
    <Dialog open={openDialog} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🗓️ Schedule Instructions</DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          <p className="mb-4 italic">
            (Skip this if you’ve already scheduled a note before.)
          </p>

          <p className="mb-2">
            Once you schedule a note, the <strong>Chrome extension</strong> will
            handle posting it.
          </p>

          <p className="mb-2 font-semibold">To ensure your note is posted:</p>
          <ul className="list-disc pl-5 space-y-1 font-medium text-foreground">
            <li>Keep your Chrome browser open (any tab is fine)</li>
            <li>You must be logged in to Substack in Chrome</li>
          </ul>

          <p className="mt-4 text-red-500 font-medium">
            If Chrome is closed or you’re logged out of Substack when the note
            is scheduled to post, it will not be posted.
          </p>

          <p className="mt-6">
            To view your scheduled notes anytime, click the extension icon in
            the top-right of your browser.
          </p>

          <motion.div
            whileHover={{ scale: 1.2, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src="/extension-click.png"
              alt="How to open the extension"
              width={200}
              height={200}
              className="rounded-md mt-4"
            />
          </motion.div>
        </DialogDescription>

        <DialogFooter>
          <Button onClick={() => setDidShowScheduleInstructions(true)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

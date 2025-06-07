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
          <DialogTitle>Schedule Instructions</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          (You can skip this if it&apos;s not the first time you schedule a
          note.)
          <br />
          <br />
          After scheduling a note, your note will be scheduled via the Chrome
          extension.
          <br />
          In order for the note to be posted,{" "}
          <span className="text-foreground font-bold">
            your Chrome browser must remain open and you have to be logged in to
            Substack on Chrome.
          </span>
          <br />
          If in the time of the scheduled post your Chrome is closed or you are
          not logged in to Substack on Chrome, the note will not be posted.
          <br />
          <br />
          You can also see the schedules from anywhere by clicking the extension
          icon in the top right corner of your browser.
          <motion.div
            whileHover={{ scale: 2, x: 240 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src="/extension-click.png"
              alt="Extension click"
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

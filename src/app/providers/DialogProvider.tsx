import React from "react";
import { NotePostedSuccessDialog } from "@/components/notes/note-posted-success-dialog";
import { ScheduleInstructionsDialog } from "@/components/notes/schedule-instructions-dialog";

export default function DialogProvider() {
  return (
    <>
      <NotePostedSuccessDialog />
      <ScheduleInstructionsDialog />
    </>
  );
} 
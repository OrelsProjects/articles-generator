"use client";

import React from "react";
import { NotePostedSuccessDialog } from "@/components/notes/note-posted-success-dialog";
import { ScheduleInstructionsDialog } from "@/components/notes/schedule-instructions-dialog";
import { EditScheduleDialog } from "@/components/queue/edit-schedule-dialog";
import { GenerateNotesDialog } from "@/components/notes/generate-notes-dialog";

export default function DialogProvider() {
  return (
    <>
      <NotePostedSuccessDialog />
      <ScheduleInstructionsDialog />
      <GenerateNotesDialog />
      <EditScheduleDialog />
    </>
  );
}
